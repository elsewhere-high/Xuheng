'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  LoaderCircle,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Unplug,
  X,
} from 'lucide-react';

type Json = Record<string, unknown>;
type Health = {
  live_model_configured: boolean;
  model_name?: string;
  erpnext_configured: boolean;
  openmes_configured: boolean;
};
type Summary = {
  first_due_on_time_units: number;
  first_due_late_units: number;
  alternate_supplier_units: number;
  recovery_cost: number;
};
type Operation = {
  order_id: string;
  line_id: string;
  start_hour: number;
  end_hour: number;
};
type Plan = {
  profile: string;
  evidence: { verified: boolean };
  scheduled_operations: Operation[];
};
type Result = {
  status: string;
  plans?: Plan[];
  plan_summaries?: Record<string, Summary>;
  work_orders?: unknown[];
  graph_trace?: { node: string; summary: string }[];
  incident?: unknown;
  incident_draft?: unknown;
  planned_actions?: unknown;
  tool_traces?: unknown;
};
type Run = {
  session_id: string;
  run_mode: string;
  model_name: string;
  result: Result;
};
type Integration = {
  mode?: string;
  report?: {
    commands?: unknown[];
    transport_acks?: unknown[];
    overall_business_status?: string;
    plan_stale?: boolean;
    replan?: { status?: string };
  };
};
type Feedback = { reconciliation?: { previous_approval_valid?: boolean } };
type EvidenceManifest = {
  records: {
    evidence_id: string;
    filename: string;
    claims?: { value: number; unit: string }[];
    extraction_mode: string;
    observed_at: string;
    sha256: string;
  }[];
};
type View = 'workbench' | 'evidence' | 'connections' | 'audit';
const API = 'http://127.0.0.1:8765';
const profiles: Record<string, string> = {
  service_first: '交付优先',
  balanced: '均衡恢复',
  stability_first: '稳定优先',
};
const statuses: Record<string, string> = {
  awaiting_approval: '等待人工审批',
  completed: '已生成草稿',
  rejected: '已驳回',
  needs_clarification: '需要补充信息',
  clarification_required: '需要补充信息',
  infeasible: '当前约束下无解',
  blocked: '运行受阻',
};
const navigation = [
  { id: 'workbench' as const, label: '决策工作台', icon: LayoutDashboard },
  { id: 'evidence' as const, label: '数据与证据', icon: FileText },
  { id: 'audit' as const, label: '本次运行记录', icon: History },
  { id: 'connections' as const, label: '接入与使用', icon: Network },
];
async function request<T = Json>(path: string, payload?: Json) {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new Error(
      '暂时无法连接本地服务。请先启动序衡 API，再点击“重新连接”。',
    );
  }
  const data = await response.json();
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : `请求失败（${response.status}），请重试。`;
    throw new Error(message);
  }
  return data as T;
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function JsonDetails({
  value,
  title = '查看完整记录',
}: {
  value: unknown;
  title?: string;
}) {
  return (
    <details className="json-details">
      <summary>{title}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}
function EmptyFlow() {
  return (
    <div className="empty-flow">
      <Image
        width={310}
        height={160}
        src="/flow-blueprint.svg"
        alt="供应异常经约束求解和人工审批，形成恢复计划"
      />
      <div>
        <h3>每个决策，都从一条事实开始。</h3>
        <p>
          运行演练后，在这里比较交付、成本与计划变更。
          <br />
          每个方案都会经过求解和独立约束验证。
        </p>
      </div>
    </div>
  );
}
function PlanTimeline({ plan }: { plan?: Plan }) {
  const assignments: Operation[] = plan?.scheduled_operations || [];
  if (!assignments.length) return null;
  const end = Math.max(...assignments.map((item) => item.end_hour), 1);
  return (
    <div className="timeline">
      <div className="section-line">
        <h3>所选方案的生产安排</h3>
        <span>场景起点后的小时数</span>
      </div>
      {assignments.map((item, i) => (
        <div className="timeline-row" key={`${item.order_id}-${i}`}>
          <span>
            {item.order_id?.replace('ord_public_cfg_', '配置 ')}
            <small>{item.line_id.replace('line_zp7_public', '装配线')}</small>
          </span>
          <div className="timeline-track">
            <div
              style={{
                marginLeft: `${(item.start_hour / end) * 100}%`,
                width: `${Math.max(((item.end_hour - item.start_hour) / end) * 100, 1)}%`,
              }}
              title={`${item.start_hour}–${item.end_hour} 小时`}
            />
          </div>
          <code>
            {item.start_hour}–{item.end_hour} h
          </code>
        </div>
      ))}
    </div>
  );
}
export function Workbench() {
  const [view, setView] = useState<View>('workbench');
  const [mode, setMode] = useState<'replay' | 'live'>('replay');
  const [text, setText] = useState(
    '座椅供应商 Mendeley seat supplier 未来 48 小时无法发运，请评估受影响订单并给出恢复方案。',
  );
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(true);
  const [run, setRun] = useState<Run | null>(null);
  const [profile, setProfile] = useState('balanced');
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [evidence, setEvidence] = useState<EvidenceManifest | null>(null);
  const [contracts, setContracts] = useState<Json | null>(null);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mes, setMes] = useState<Integration | null>(null);
  const [mesFeedback, setMesFeedback] = useState<Feedback | null>(null);
  const [integrationProfile, setIntegrationProfile] = useState(
    'kingdee_blacklake_contract_profile',
  );
  const busy = Boolean(phase);
  const result = run?.result;
  const summaries: Record<string, Summary> = result?.plan_summaries || {};
  const selectedPlan = result?.plans?.find((item) => item.profile === profile);
  const selectedSummary = summaries[profile];
  const status = result?.status;
  const invalidated =
    feedback?.reconciliation?.previous_approval_valid === false ||
    mesFeedback?.reconciliation?.previous_approval_valid === false;
  async function connect() {
    setChecking(true);
    setError('');
    try {
      const current = await request<Health>('/health');
      setHealth(current);
      const [files, manifest] = await Promise.all([
        request<EvidenceManifest>('/api/v1/evidence'),
        request('/api/v1/contracts'),
      ]);
      setEvidence(files);
      setContracts(manifest);
    } catch (reason) {
      setHealth(null);
      setError((reason as Error).message);
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      request<Health>('/health'),
      request<EvidenceManifest>('/api/v1/evidence'),
      request('/api/v1/contracts'),
    ])
      .then(([current, files, manifest]) => {
        if (cancelled) return;
        setHealth(current);
        setEvidence(files);
        setContracts(manifest);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function execute(label: string, action: () => Promise<void>) {
    setPhase(label);
    setError('');
    try {
      await action();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPhase('');
    }
  }
  function clearRun() {
    setRun(null);
    setIntegration(null);
    setFeedback(null);
    setMes(null);
    setMesFeedback(null);
    setError('');
  }
  function start() {
    clearRun();
    void execute(
      mode === 'replay'
        ? '正在运行回放、求解与验证…'
        : '正在分析输入、求解与验证…',
      async () => {
        const data = await request<Run>(
          '/api/v1/agent/run',
          mode === 'replay' ? { mode, case_id: 'seat_delay' } : { mode, text },
        );
        setRun(data);
        setProfile('balanced');
      },
    );
  }
  function approve(decision: 'approve' | 'reject') {
    void execute(
      decision === 'approve' ? '正在复核方案并记录审批…' : '正在记录驳回决定…',
      async () => {
        const data = await request<{ result: Result }>(
          '/api/v1/agent/approve',
          {
            session_id: run?.session_id,
            profile,
            decision,
          },
        );
        if (run) setRun({ ...run, result: data.result });
      },
    );
  }
  function integrate() {
    void execute('正在生成命令并核对执行结果…', async () => {
      const endpoint =
        integrationProfile === 'erpnext_open_source_test_profile'
          ? '/api/v1/integration/erpnext/run'
          : '/api/v1/integration/run';
      setIntegration(
        await request<Integration>(endpoint, {
          session_id: run?.session_id,
          profile: integrationProfile,
        }),
      );
    });
  }
  const title = navigation.find((item) => item.id === view)?.label;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="序衡首页">
          <Image width={64} height={64} src="/logo.svg" alt="" />
          <span>
            序衡<small>XUHENG</small>
          </span>
        </Link>
        <p className="brand-description">制造供应链决策智能体</p>
        <nav aria-label="主导航">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? 'nav-item active' : 'nav-item'}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {view === id && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={22} />
          <strong>有据可依，有人把关。</strong>
          <p>
            从异常研判到恢复草稿，
            <br />
            让每一步决定可追溯。
          </p>
        </div>
        <button className="local-status" onClick={() => setView('connections')}>
          <span className={`dot ${health ? 'online' : ''}`} />
          <span>
            {health
              ? '本地服务已就绪'
              : checking
                ? '正在连接本地服务'
                : '本地服务未连接'}
            <small>独立工作空间 · v0.1.0</small>
          </span>
          <ChevronRight size={14} />
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            制造计划 <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <span className="tag">
            <Database size={13} /> 公开数据演练
          </span>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <h1>
                {view === 'workbench' ? '把异常，变成可执行的决策。' : title}
              </h1>
              <p>
                {view === 'workbench'
                  ? '看清异常影响，权衡恢复方案，让制造决策有据可依。'
                  : view === 'evidence'
                    ? '每一条结论，都应能回到它的来源。'
                    : view === 'audit'
                      ? '查看本次研判、工具调用、审批与执行反馈。'
                      : '连接所需的能力，从本地演练开始。'}
              </p>
            </div>
            {view === 'workbench' ? (
              <button
                className="button secondary compact"
                onClick={() => setView('connections')}
              >
                <CircleHelp size={16} /> 使用说明
              </button>
            ) : (
              <button
                className="button secondary compact"
                onClick={() => setView('workbench')}
              >
                返回工作台 <ArrowRight size={16} />
              </button>
            )}
          </div>
          {error && (
            <div className="notice error" role="alert">
              <Unplug size={19} />
              <div>
                <strong>操作暂未完成</strong>
                <p>{error}</p>
              </div>
              <button
                className="button secondary compact"
                onClick={connect}
                disabled={checking}
              >
                重新连接
              </button>
            </div>
          )}
          {busy && (
            <output className="running-state">
              <LoaderCircle className="spin" size={17} />
              {phase}
              <span />
            </output>
          )}
          {view === 'workbench' && (
            <>
              <div className="work-grid">
                <section className="panel incident-panel">
                  <div className="section-line">
                    <h2>本次异常</h2>
                    <div className="segmented" aria-label="分析模式">
                      {(['replay', 'live'] as const).map((item) => (
                        <button
                          key={item}
                          aria-pressed={mode === item}
                          disabled={busy}
                          onClick={() => {
                            setMode(item);
                            clearRun();
                          }}
                        >
                          {item === 'replay' ? '离线演练' : '实时分析'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {mode === 'replay' ? (
                    <div className="incident-brief">
                      <div className="case-title">
                        <span className="case-icon">
                          <ClipboardList size={22} />
                        </span>
                        <div>
                          <h3>座椅供应中断</h3>
                          <p>汽车装配 · Q2J 座椅组件</p>
                        </div>
                      <span className="tag warning">{result ? statuses[status || ''] || status : '待研判'}</span>
                      </div>
                      <p className="case-description">
                        供应商通知：未来 <strong>48 小时</strong>
                        无法发运座椅。现有库存能支持多少订单？应急采购与调整排程，该如何取舍？
                      </p>
                      <dl className="case-facts">
                        <div>
                          <dt>演练订单</dt>
                          <dd>3 张 / 217 台</dd>
                        </div>
                        <div>
                          <dt>输入来源</dt>
                          <dd>合成供应商邮件</dd>
                        </div>
                        <div>
                          <dt>分析方式</dt>
                          <dd>固定回放 + 实际求解</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="live-input">
                      <label htmlFor="incident">
                        描述供应、产线或需求发生的变化
                      </label>
                      <textarea
                        id="incident"
                        rows={5}
                        maxLength={5000}
                        value={text}
                        disabled={busy}
                        onChange={(event) => {
                          setText(event.target.value);
                          if (run) clearRun();
                        }}
                        placeholder="请写明受影响对象、持续时间和已知事实。"
                      />
                      <div className="input-meta">
                        <span>
                          {health?.live_model_configured
                            ? `已配置模型：${health.model_name}`
                            : '实时模型尚未配置，接入与使用页提供设置方法。'}
                        </span>
                        <span>{text.length}/5000</span>
                      </div>
                    </div>
                  )}
                  <div className="run-actions">
                    <p>
                      <ShieldCheck size={15} />
                      {mode === 'replay'
                        ? '演练不需要模型密钥，结果由本机求解器生成。'
                        : '模型抽取候选事实，求解器与验证器核查方案。'}
                    </p>
                    <button
                      className="button primary"
                      onClick={start}
                      disabled={
                        busy ||
                        !health ||
                        (mode === 'live' &&
                          (!health.live_model_configured ||
                            text.trim().length < 8))
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : (
                        <Play size={17} />
                      )}{' '}
                      {run ? '重新分析' : '开始分析'}
                    </button>
                  </div>
                </section>
                <aside className="process-rail">
                  <h2>决策路径</h2>
                  <ol>
                    {[
                      ['识别异常', '提取事实，保留来源'],
                      ['求解与验证', '核查产能、物料和交期'],
                      ['人工审批', '权衡方案，确认草稿'],
                      ['执行与回流', '核对结果，变化后重算'],
                    ].map(([label, description], i) => (
                      <li
                        key={label}
                        className={
                          (i < 2 && result) ||
                          (i === 2 && status === 'completed') ||
                          (i === 3 && integration)
                            ? 'done'
                            : ''
                        }
                      >
                        <span>
                          {(i < 2 && result) ||
                          (i === 2 && status === 'completed') ||
                          (i === 3 && integration) ? (
                            <Check size={13} />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <div>
                          <strong>{label}</strong>
                          <p>{description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <button onClick={() => setView('evidence')}>
                    查看演练数据来源 <ArrowRight size={14} />
                  </button>
                </aside>
              </div>
              <section className="panel comparison-panel">
                <div className="section-line">
                  <div>
                    <h2>恢复方案比较</h2>
                    <p>
                      {result
                        ? `${run?.run_mode === 'replay' ? '离线回放' : '实时模型'} · ${statuses[status || ''] || status}`
                        : '运行分析后，比较不同目标下的恢复代价。'}
                    </p>
                  </div>
                  {result && (
                    <button
                      className="button text-button"
                      onClick={() => download(run, 'xuheng-decision.json')}
                    >
                      <ArrowDownToLine size={16} /> 导出决策记录
                    </button>
                  )}
                </div>
                {!result ? (
                  <EmptyFlow />
                ) : (
                  <>
                    {Object.keys(summaries).length ? (
                      <>
                        <section
                          className="table-scroll"
                          aria-label="恢复方案对比表"
                        >
                          <table className="plan-table">
                            <thead>
                              <tr>
                                <th>选择方案</th>
                                <th>首交期按时 / 延期</th>
                                <th>应急采购</th>
                                <th>恢复成本</th>
                                <th>约束验证</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(summaries).map(([key, value]) => {
                                const verified = result.plans?.find(
                                  (item) => item.profile === key,
                                )?.evidence?.verified;
                                return (
                                  <tr
                                    key={key}
                                    className={
                                      profile === key ? 'selected' : ''
                                    }
                                  >
                                    <th scope="row">
                                      <label>
                                        <input
                                          type="radio"
                                          aria-label={profiles[key] || key}
                                          name="plan"
                                          value={key}
                                          checked={profile === key}
                                          disabled={
                                            busy ||
                                            status !== 'awaiting_approval'
                                          }
                                          onChange={() => setProfile(key)}
                                        />
                                        <span>
                                          {profiles[key] || key}
                                          <small>
                                            {key === 'balanced'
                                              ? '兼顾交付与成本'
                                              : key === 'service_first'
                                                ? '优先减少延迟交付'
                                                : '尽量减少计划变更'}
                                          </small>
                                        </span>
                                      </label>
                                    </th>
                                    <td>
                                      <strong>
                                        {value.first_due_on_time_units}
                                      </strong>{' '}
                                      <span>
                                        / {value.first_due_late_units} 台
                                      </span>
                                    </td>
                                    <td>{value.alternate_supplier_units} 件</td>
                                    <td className="numeric">
                                      ¥{' '}
                                      {Number(
                                        value.recovery_cost,
                                      ).toLocaleString('zh-CN')}
                                    </td>
                                    <td>
                                      <span
                                        className={`verification ${verified ? '' : 'unverified'}`}
                                      >
                                        {verified ? (
                                          <CheckCircle2 size={14} />
                                        ) : (
                                          <CircleHelp size={14} />
                                        )}
                                        {verified ? '已验证' : '未通过'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </section>
                        <p className="table-caption">
                          数值来自本次求解。成本为演练数据中的金额尺度；选择方案不会自动创建工单。
                        </p>
                        <PlanTimeline plan={selectedPlan} />
                      </>
                    ) : (
                      <div className="notice warning">
                        <CircleHelp size={20} />
                        <div>
                          <strong>
                            {statuses[status || ''] || '本次没有可供审批的方案'}
                          </strong>
                          <p>
                            请查看候选事实和运行记录，补齐缺失信息或解决约束冲突后重新分析。
                          </p>
                        </div>
                        <button
                          className="button secondary"
                          onClick={() => setView('audit')}
                        >
                          查看原因
                        </button>
                      </div>
                    )}
                    {status === 'awaiting_approval' && (
                      <div className="approval-bar">
                        <div>
                          <ShieldCheck size={24} />
                          <span>
                            <strong>待审批：{profiles[profile]}</strong>
                            <small>
                              {selectedSummary
                                ? `首交期按时 ${selectedSummary.first_due_on_time_units} 台 · 恢复成本 ¥${selectedSummary.recovery_cost}`
                                : '请先选择已验证的方案'}{' '}
                              · 批准后生成草稿
                            </small>
                          </span>
                        </div>
                        <div>
                          <button
                            className="button secondary"
                            onClick={() => approve('reject')}
                            disabled={busy}
                          >
                            <X size={16} /> 驳回
                          </button>
                          <button
                            className="button primary"
                            onClick={() => approve('approve')}
                            disabled={busy || !selectedPlan?.evidence?.verified}
                          >
                            <Check size={16} /> 批准所选方案
                          </button>
                        </div>
                      </div>
                    )}
                    {status === 'completed' && (
                      <div className="notice success">
                        <CheckCircle2 size={21} />
                        <div>
                          <strong>
                            审批已记录 · 已生成{' '}
                            {result.work_orders?.length || 0} 条草稿
                          </strong>
                          <p>
                            下一步可在本地合同沙箱核对执行反馈；外部测试实例需另行配置。
                          </p>
                        </div>
                      </div>
                    )}
                    {status === 'rejected' && (
                      <div className="notice warning">
                        <X size={19} />
                        <div>
                          <strong>方案已驳回</strong>
                          <p>本次没有生成工单。调整输入后可重新分析。</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
              {status === 'completed' && (
                <section className="panel execution-panel">
                  <div className="section-line">
                    <div>
                      <h2>执行与反馈</h2>
                      <p>
                        传输接收与业务完成分别记录，执行变化后需要重新审批。
                      </p>
                    </div>
                    <span className="tag">
                      {integration?.mode === 'real_erpnext_test_instance'
                        ? 'ERPNext 测试实例'
                        : '本地合同沙箱'}
                    </span>
                  </div>
                  <div className="execution-controls">
                    <label htmlFor="integration">
                      执行目标
                      <select
                        id="integration"
                        value={integrationProfile}
                        disabled={busy || Boolean(integration)}
                        onChange={(event) =>
                          setIntegrationProfile(event.target.value)
                        }
                      >
                        <option value="kingdee_blacklake_contract_profile">
                          本地合同沙箱 · 金蝶 / 黑湖风格
                        </option>
                        <option value="sap_s4_dm_contract_profile">
                          本地合同沙箱 · SAP S/4 / DM 风格
                        </option>
                        {health?.erpnext_configured && (
                          <option value="erpnext_open_source_test_profile">
                            ERPNext 测试实例 · 仅草稿
                          </option>
                        )}
                      </select>
                    </label>
                    <button
                      className="button primary"
                      onClick={integrate}
                      disabled={busy || invalidated || Boolean(integration)}
                    >
                      <Play size={16} />
                      {integration ? '本次执行已记录' : '运行并核对反馈'}
                    </button>
                  </div>
                  {integration?.report && (
                    <>
                      <div className="execution-summary">
                        <div>
                          <span>命令已发送</span>
                          <strong>
                            {integration.report.commands?.length || 0}
                          </strong>
                        </div>
                        <div>
                          <span>传输响应已记录</span>
                          <strong>
                            {integration.report.transport_acks?.length || 0}
                          </strong>
                        </div>
                        <div>
                          <span>业务执行状态</span>
                          <strong>
                            {integration.report.overall_business_status}
                          </strong>
                        </div>
                        <div>
                          <span>旧审批</span>
                          <strong>
                            {integration.report.plan_stale
                              ? '已失效，需重新审批'
                              : '仍有效'}
                          </strong>
                        </div>
                      </div>
                      <p className="table-caption">
                        本地沙箱刻意演示部分执行失败与回流，便于检查重新求解和审批失效行为。
                      </p>
                      <JsonDetails
                        value={integration.report}
                        title="查看命令、回调与重算证据"
                      />
                    </>
                  )}
                  {integration?.mode === 'real_erpnext_test_instance' && (
                    <div className="external-results">
                      <JsonDetails
                        value={integration}
                        title="查看 ERPNext 草稿与回读记录"
                      />
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          void execute('正在读取 ERPNext 反馈…', async () =>
                            setFeedback(
                              await request(
                                '/api/v1/integration/erpnext/feedback',
                                { session_id: run?.session_id },
                              ),
                            ),
                          )
                        }
                      >
                        <RefreshCw size={16} /> 读取 ERPNext 回流
                      </button>
                      {health?.openmes_configured && (
                        <button
                          className="button secondary"
                          disabled={busy || invalidated || Boolean(mes)}
                          onClick={() =>
                            void execute('正在同步 OpenMES 工单…', async () =>
                              setMes(
                                await request(
                                  '/api/v1/integration/openmes/run',
                                  { session_id: run?.session_id },
                                ),
                              ),
                            )
                          }
                        >
                          同步到 OpenMES 测试实例
                        </button>
                      )}
                      {feedback && (
                        <JsonDetails
                          value={feedback}
                          title="查看 ERPNext 执行变化"
                        />
                      )}
                      {mes && (
                        <>
                          <JsonDetails
                            value={mes}
                            title="查看 OpenMES 同步结果"
                          />
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() =>
                              void execute('正在读取 OpenMES 反馈…', async () =>
                                setMesFeedback(
                                  await request(
                                    '/api/v1/integration/openmes/feedback',
                                    { session_id: run?.session_id },
                                  ),
                                ),
                              )
                            }
                          >
                            读取 OpenMES 回流
                          </button>
                        </>
                      )}
                      {mesFeedback && (
                        <JsonDetails
                          value={mesFeedback}
                          title="查看 OpenMES 执行变化"
                        />
                      )}
                      {invalidated && (
                        <div className="notice warning">
                          执行事实发生变化，旧审批已失效。请重新分析和审批。
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
              <footer className="workspace-footer">
                <span>序衡 · 每一步决定，都可追溯</span>
                <button onClick={() => setView('audit')}>
                  打开本次运行记录 <ArrowRight size={14} />
                </button>
              </footer>
            </>
          )}
          {view === 'evidence' && (
            <section className="panel content-panel">
              <h2>公开数据，明确的演练边界</h2>
              <p>
                基础工作簿来自 Mendeley 汽车供应链数据集（CC BY
                4.0）。座椅延迟、客户交期及应急采购成本等演练覆盖层带有来源说明，不代表真实工厂的生产记录。
              </p>
              <a
                className="inline-link"
                href="https://data.mendeley.com/datasets/pr3sdy5vp3/1"
                target="_blank"
                rel="noreferrer"
              >
                查看公开数据集 <ArrowRight size={15} />
              </a>
              <hr />
              <div className="section-line">
                <div>
                  <h2>多来源证据样例</h2>
                  <p>
                    这些是冲突检查案例的合成附件：邮件声称 48 小时，承运通知声称
                    72 小时；MES 快照已经过期。不能据此静默选择一个数值。
                  </p>
                </div>
              </div>
              <div className="evidence-list">
                {(evidence?.records || []).map((item) => (
                  <article key={item.evidence_id}>
                    <FileText size={23} />
                    <div>
                      <h3>{item.filename}</h3>
                      <p>
                        {item.claims
                          ?.map((claim) => `${claim.value} ${claim.unit}`)
                          .join(' · ')}{' '}
                        · {item.extraction_mode}
                      </p>
                      <small>合成样例 · {item.observed_at}</small>
                      <details>
                        <summary>内容校验值</summary>
                        <code>{item.sha256}</code>
                      </details>
                    </div>
                    <a
                      className="button secondary compact"
                      href={`${API}/evidence/${item.filename}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      查看文件 <ArrowRight size={14} />
                    </a>
                  </article>
                ))}
              </div>
              {!evidence && (
                <p className="muted">连接本地服务后可查看证据文件。</p>
              )}
              <p className="table-caption">
                图片的文字定位采用预计算 OCR 样例；PDF 使用文本层，CSV
                按字段读取。未运行实时 OCR。
              </p>
            </section>
          )}
          {view === 'audit' && (
            <section className="panel content-panel">
              <div className="section-line">
                <div>
                  <h2>{run ? '本次决策记录' : '还没有运行记录'}</h2>
                  <p>
                    {run
                      ? `${run?.run_mode === 'replay' ? '离线回放' : '实时模型'} · ${statuses[status || ''] || status}`
                      : '先回到工作台运行一次分析，工具轨迹与审批记录会显示在这里。'}
                  </p>
                </div>
                {run && (
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        { run, integration, feedback, mes, mesFeedback },
                        'xuheng-audit.json',
                      )
                    }
                  >
                    <ArrowDownToLine size={16} /> 导出审计记录
                  </button>
                )}
              </div>
              {run && result ? (
                <>
                  <dl className="audit-facts">
                    <div>
                      <dt>运行会话</dt>
                      <dd>{run.session_id}</dd>
                    </div>
                    <div>
                      <dt>模型标识</dt>
                      <dd>{run.model_name}</dd>
                    </div>
                  </dl>
                  <JsonDetails
                    value={result.incident || result.incident_draft}
                    title="候选事实与来源"
                  />
                  <h3>决策图实际轨迹</h3>
                  <ol className="audit-trace">
                    {(result.graph_trace || []).map((item, index) => (
                      <li key={index}>
                        <span>{index + 1}</span>
                        <div>
                          <strong>{item.node}</strong>
                          <p>{item.summary}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <JsonDetails
                    value={result.planned_actions || []}
                    title="计划调用的工具"
                  />
                  <JsonDetails
                    value={result.tool_traces || []}
                    title="工具执行明细"
                  />
                  <JsonDetails
                    value={result}
                    title="完整求解、验证与审批记录"
                  />
                  {integration && (
                    <JsonDetails
                      value={{ integration, feedback, mes, mesFeedback }}
                      title="集成执行及回流记录"
                    />
                  )}
                </>
              ) : (
                <EmptyFlow />
              )}
            </section>
          )}
          {view === 'connections' && (
            <section className="panel content-panel">
              <div className="section-line">
                <h2>运行服务</h2>
                <button
                  className="button secondary compact"
                  onClick={connect}
                  disabled={checking}
                >
                  <RefreshCw className={checking ? 'spin' : ''} size={15} />{' '}
                  刷新状态
                </button>
              </div>
              <div className="connection-list">
                {[
                  [
                    '本地分析 API',
                    health ? '已连接' : '未连接',
                    '承载回放、求解、审批与合同沙箱。',
                  ],
                  [
                    '实时语言模型',
                    health?.live_model_configured
                      ? `已配置 · ${health.model_name}`
                      : '未配置',
                    '需要兼容 OpenAI 格式的模型服务。配置状态不代表已验证连通。',
                  ],
                  [
                    'ERPNext 测试实例',
                    health?.erpnext_configured ? '已配置' : '未配置',
                    '允许读取主数据及创建 Material Request / Work Order 草稿。',
                  ],
                  [
                    'OpenMES 测试实例',
                    health?.openmes_configured ? '已配置' : '未配置',
                    '允许已审批工单导入及执行状态回读。',
                  ],
                ].map(([name, state, description]) => (
                  <div key={name}>
                    <span className="connection-icon">
                      <Database size={20} />
                    </span>
                    <div>
                      <h3>{name}</h3>
                      <p>{description}</p>
                    </div>
                    <span className="tag">{state}</span>
                  </div>
                ))}
              </div>
              <h2>从本地演练开始</h2>
              <ol className="guide-list">
                <li>
                  在项目目录激活 Conda 环境：
                  <code>conda activate ./.conda</code>
                </li>
                <li>
                  启动分析接口：<code>python -m xuheng.demo_api</code>
                </li>
                <li>
                  在前端目录运行 <code>npm run dev -- --port 3000</code>
                  ，打开本工作台。
                </li>
                <li>
                  保留“离线演练”，点击“开始分析”。比较方案后，人工选择批准或驳回。
                </li>
              </ol>
              <h3>配置实时分析与外部测试实例</h3>
              <p>
                复制项目中的 <code>.streamlit/secrets.toml.example</code> 为{' '}
                <code>secrets.toml</code>
                ，仅在本地填写所需配置并重启服务。模型配置项为{' '}
                <code>XUHENG_LLM_BASE_URL</code>、<code>XUHENG_LLM_MODEL</code>
                、<code>XUHENG_API_KEY</code>
                。接入教程与环境变量清单见项目文档。
              </p>
              <div className="notice info">
                <ShieldCheck size={20} />
                <p>
                  审批绑定场景和计划。输入或外部反馈改变约束后必须重算；已批准动作也只允许产生草稿，系统不直接控制生产设备。
                </p>
              </div>
              <h3>接口契约</h3>
              <p>本地合同沙箱演示 ERP/MES 消息映射，未取得商业厂商认证。</p>
              <div className="button-row">
                <a
                  className="button secondary"
                  href={`${API}/contracts/openapi.yaml`}
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenAPI 契约
                </a>
                <a
                  className="button secondary"
                  href={`${API}/contracts/asyncapi.yaml`}
                  target="_blank"
                  rel="noreferrer"
                >
                  AsyncAPI 契约
                </a>
              </div>
              {contracts && (
                <JsonDetails
                  value={contracts}
                  title="查看接口路径、系统职责和参考资料"
                />
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
