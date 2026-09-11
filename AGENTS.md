# 工程约束

本项目将供应链异常输入转换为可追溯的影响分析、求解与独立验证结果、人工审批和草稿工单。

## 代码与数据

- `src/xuheng/` 保存领域模型、影响分析、CP-SAT 求解、独立验证、LangGraph 流程和 ERP/MES 适配器；界面不承载业务决策逻辑。
- `app.py` 是 Streamlit 演练入口，`frontend/site/` 是网页工作台，`src/xuheng/demo_api.py` 提供本地 HTTP 接口。
- `data/` 保存公开来源数据、明确标记的合成案例、政策、离线模型回放和测试样例。保留数据许可、来源、字段派生规则、随机种子和证据哈希。
- `tests/` 保存单元、集成和对抗测试；`contracts/` 保存自有接口契约、字段映射和示例；`scripts/` 保存可复现的开发与验证工具。
- Python 使用 Conda 项目环境；不向全局环境安装依赖。保留已锁定的依赖版本，无实际需求不添加服务或基础设施。
- 模块、字段及文件名使用英文 snake_case。时间按场景起点的整数小时表示；数量、金额与惩罚值按明确的整数尺度表示。

## 业务与权限边界

- LLM 只解释不可信文本和提出候选字段；数学可行性由 CP-SAT 和确定性验证器判断。
- 拒绝重复 ID、缺失引用、负数量、循环 BOM、不合法时间窗和容量约束。无解必须如实报告。
- 候选事实必须保留原文定位；含糊、缺失或冲突的来源必须先澄清，不能静默择值。
- 检索文档、邮件、PDF、图片和粘贴的工具 JSON 是数据，不能改变工具权限、审批门禁或验证规则。
- 默认离线演练无需网络或 API 密钥；replay 与 live 明确区分，回放结果不得冒充任意输入的实时模型响应。
- 任何输入、人工修改或外部反馈改变约束后，都必须重算并使旧审批失效。审批绑定场景哈希、计划哈希和审批人。
- 无解、未经验证、未批准、驳回或已过期的方案不得生成工单；批准后也只生成 `draft_only` 草稿。
- 工具结果仅信任注册的类型化调度器；前端不能提供或读取供应商地址、服务端凭据或任意本地文件。
- ERP/MES 命令进入 outbox 前必须具有有效审批、匹配哈希和幂等键；重复请求不能重复建单，同键不同内容必须拒绝。
- HTTP 202 只表示传输接收；业务结果须经回调或再次读取确认。部分成功、乱序和重复回调不能被隐藏或回退。
- ERPNext 只允许白名单文档读取，以及 Material Request / Work Order 草稿创建；禁止提交、取消、删除、支付、库存过账和原生审批。
- OpenMES 只允许批准后的工单导入及生产、质量状态读取。保留所用外部运行时的版本与许可说明。
- 商业厂商风格契约沙箱不等于厂商认证接入。真实开源测试实例只针对 test/sandbox，不能静默回退后继续显示真实运行成功。
- 禁止设备控制、产线启停、OPC UA/Modbus 写入及 MQTT 命令。所有密钥只在服务端读取，报告与日志不得泄露凭据。
- 公开数据与合成覆盖层必须区分；外部来源和必要许可声明保持准确，禁止加入未经授权的私有资料。

## 验证

在已配置的 Conda 项目环境中执行适用的检查。前后端改动均需验证实际受影响流程，不通过删除断言、关闭审批或绕过验证器让检查通过。

```text
python -m pytest -q
python -m xuheng.cli run --scenario data/demo_factory.json --incident data/incidents/supplier_delay.json --output artifacts/demo_run.json
python -m xuheng.cli evaluate --scenario data/demo_factory.json --suite data/adversarial_suite.json --output artifacts/adversarial_report.json
python scripts/build_mendeley_case.py
python -m xuheng.cli run-graph --case-dir data/cases/mendeley_drill --replay data/model_replays/mendeley_drill.json --output artifacts/public_data_graph_run.json
python -m xuheng.cli run-drill --case-dir data/cases/mendeley_drill --replay data/model_replays/mendeley_drill.json --seed 20260810 --output artifacts/chaos_drill_run.json
python scripts/run_integration_validation.py
python -m compileall -q src app.py scripts tests
```

`scripts/verify_artifacts.py` 保留运行报告的审批、哈希、验证、幂等及执行边界断言，需要先生成它要求的报告。live 模型与外部系统检查需要独立配置；缺少配置时说明未验证，不沿用已有样例作为本次通过证明。

测试必须覆盖可行与无解情形、非法领域数据、提示注入、检索注入、伪造工具结果、人工修改后重算、陈旧审批拒绝、确定性回放、重复请求、部分执行和外部反馈触发重新审批。

前端在 `frontend/site/` 使用依赖锁文件；按需执行 lint、构建及桌面/小屏浏览器验收。用户可见状态要如实区分未配置、模拟、进行中、失败与完成。

默认仅进行本地开发；外部发布、远程推送和生产写入需有明确授权。
