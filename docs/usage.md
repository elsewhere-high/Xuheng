# 序衡使用与接入

## 完成一次决策

1. 在网页工作台保持“离线演练”，运行座椅供应中断案例。回放内容固定，不接收自定义事故文本。
2. 对比三个方案的首交期按时数量、延期数量、应急件数和恢复成本；查看所选方案工序时间。
3. 点击“批准所选方案”生成草稿，或点击“驳回”结束。本地网页把操作人记录为 `xuheng_local_planner`；它是单用户演练入口，没有企业身份认证。Streamlit 入口可填写审批人和意见。
4. 选择本地合同沙箱后运行反馈演练。沙箱有意产生部分执行失败，检查旧审批失效与重新求解状态。HTTP 202 只表示接收消息。
5. 从“本次运行记录”导出 JSON。刷新网页会清空前端展示；重启 API 会清空内存中的分析会话。持久化集成账本保存在本地 `.tmp/`。

## 演练实验室

运行 `python -m streamlit run app.py`。左侧切换异常、方案、执行、审计和数据；在演练设置中选择案例。

- 来源冲突：48 小时邮件与 72 小时承运通知相互矛盾，系统先暂停，由人确认权威来源。
- 提示注入：邮件中的绕过审批或关闭验证器要求不能提升权限。
- 无解需求：对超出资源上界的交付要求报告缺口，不能生成虚假的可行排程。
- 随机演练：固定 seed 可复现事件，适合回归比较。

## 配置实时模型

在项目根目录复制 `.streamlit/secrets.toml.example` 为 `.streamlit/secrets.toml`，填写以下字段，重启 API 或 Streamlit：

```toml
XUHENG_LLM_BASE_URL = "https://your-model-provider.example/v1"
XUHENG_LLM_MODEL = "your-model-id"
XUHENG_API_KEY = ""
```

上面的地址仅为格式示例，需替换为自己的服务。也可用进程环境变量配置同名字段。配置完成后切换“实时分析”，输入供应商、物料、产线、时间等信息。只有独立验证通过的计划才可审批。API 仍使用内置公开案例主数据，不是任意企业数据上传接口。

## 外部测试实例

ERPNext 配置项：`XUHENG_ERPNEXT_BASE_URL`、`XUHENG_ERPNEXT_API_KEY`、`XUHENG_ERPNEXT_API_SECRET`、`XUHENG_ERPNEXT_ENVIRONMENT`。环境仅允许 `test` 或 `sandbox`，物料、公司、BOM 映射见 `data/integrations/erpnext_demo_mapping.json`。仅支持主数据读取和 Material Request / Work Order 草稿写入。

OpenMES 配置项：`XUHENG_OPENMES_BASE_URL`、`XUHENG_OPENMES_API_KEY`、`XUHENG_OPENMES_ENVIRONMENT`。映射见 `data/integrations/openmes_demo_mapping.json`。先生成已批准的 ERPNext 工单，再导入 OpenMES。读取执行反馈本身不会改变工单状态。外部运行时许可与版本见第三方声明。

不得把“配置已发现”当作连接测试成功。真实联调脚本需要对应测试实例、权限和主数据，详见脚本的命令帮助。不要把凭据写进前端、命令历史或提交到 Git。

## 本地 API

默认监听 `127.0.0.1:8765`，网页开发服务监听 3000。此接口是单用户本地开发入口，不应直接暴露到公共网络。

| 方法与路径 | 作用 |
| --- | --- |
| `GET /health` | 服务状态与各项配置状态 |
| `POST /api/v1/agent/run` | 固定回放或实时文本分析 |
| `POST /api/v1/agent/approve` | `approve` / `reject` 决策与方案选择 |
| `POST /api/v1/integration/run` | 本地合同沙箱执行与反馈 |
| `POST /api/v1/integration/erpnext/run` | ERPNext 测试实例草稿写入 |
| `POST /api/v1/integration/erpnext/feedback` | ERPNext 受监控单据变化回读 |
| `POST /api/v1/integration/openmes/run` | OpenMES 已批准工单导入 |
| `POST /api/v1/integration/openmes/feedback` | OpenMES 执行变化回读 |
| `GET /api/v1/evidence` | 合成证据清单与内容校验值 |
| `GET /api/v1/contracts` | 接口契约与系统职责说明 |

离线请求为 `{"mode":"replay","case_id":"seat_delay"}`；实时请求为 `{"mode":"live","text":"事故描述"}`。审批需返回的 `session_id`、`decision`，批准时加 `profile`（`service_first`、`balanced`、`stability_first`）。

前端打不开时先检查终端服务；“未连接”可通过“重新连接”恢复。模型未配置时可继续使用离线演练。缺失或过期的审批不能通过刷新页面绕过，应重新分析。
