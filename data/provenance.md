# 数据来源与使用边界

`public/mendeley_automotive/2020_dataset_automotive_production_network.xlsb` 是公开数据集的原始工作簿，SHA-256 为 `1ea0bcdea3225d308be913c9ca0f377585e1863847c78d6e8eec10b6de82889e`。

- 数据集：Optimisation model for multi-item multi-echelon supply chains with nested multi-level products。
- DOI：<https://doi.org/10.17632/pr3sdy5vp3.1>。
- 数据集页面：<https://data.mendeley.com/datasets/pr3sdy5vp3/1>。
- 许可：CC BY 4.0；必要说明同时见根目录 `THIRD_PARTY_NOTICES.md`。

`cases/mendeley_drill/lineage.json` 记录选定需求行、BOM、库存、提前期和产能的公开工作表来源，选定需求聚合为 217 台。客户名称、优先级、事故消息、备用采购价格、预算和审批记录属于合成覆盖层，不代表真实企业的运营数据。

`demo_factory.json`、`cases/delivery_crisis/` 及各个异常和对抗案例是本地功能验证使用的合成样例。场景文件中的 provenance、seed、derived_fields 与数据格式版本须一并保留。

`cases/mendeley_drill/evidence/manifest.json` 绑定邮件图片、承运通知 PDF 和 MES CSV 的实际字节哈希；48 小时与 72 小时的冲突用于验证澄清流程。更改证据文件时必须同步重建哈希及定位信息，不能跳过完整性校验。

`model_replays/` 保存离线模型回放，`evals/` 保存固定评测输入。`fixtures/approved_graph_run.json` 是供集成测试读取的预先计算方案样例，不是本次安装、运行或验收通过的证明。

`integrations/` 内的公司、仓库、物料与产线编码均为演示配置。真实测试实例的映射和凭据需由使用者在服务端配置，不得把样例映射当作生产配置。
