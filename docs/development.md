# 序衡开发与验证

Python 命令全部在项目 Conda 环境内运行，前端依赖由 `package-lock.json` 固定。可使用 `requirements-lock.txt` 中记录的完整 Python 依赖快照重建本次环境，随后安装本项目：`python -m pip install -r requirements-lock.txt`、`python -m pip install -e .`。

## 自动化检查

```powershell
conda activate ./.conda
python -m pytest -q
python -m compileall -q src app.py scripts tests
python scripts/validate_offline.py
python scripts/verify_artifacts.py
```

`validate_offline.py` 重新生成核心、对抗、回放、无解、随机事故和合同沙箱报告。`artifacts/` 中只保存当前运行产物，不纳入源码提交。测试夹具位于 `data/fixtures/`，不能替代本次运行证明。

实时模型报告需自行配置后生成，验证时明确提供模型标识：

```powershell
python scripts/verify_artifacts.py --include-live --expected-model your-model-id
```

对真实 ERPNext 和 OpenMES 的报告另加 `--include-external`。这些标志会要求相应报告存在并执行原有完整断言；缺少报告时不会被当作通过。

## 构建

```powershell
python -m build
cd frontend/site
npm run lint
npm exec tsc -- --noEmit
npm run build
```

Python wheel 提供领域代码、CLI 与本地 API 所需公开数据和契约。网页与 Streamlit 开发入口保留在项目目录。安装 wheel 后可从任意目录执行 `xuheng --help`；CLI 的场景等路径参数按调用目录解析，需要明确传入数据路径。

网页使用 Vinext 的本地 Cloudflare 运行适配，构建结果在 `frontend/site/dist/`。`npm start` 启动本地构建预览。项目没有远程绑定或自动发布配置。

## 数据变更

`scripts/build_mendeley_case.py` 从原始公开工作簿构建案例；其来源行、覆盖层种子和许可不可丢失。证据文件有内容哈希；修改后必须重新生成 `evidence/manifest.json` 并运行证据与流程测试。普通文本统一 LF，哈希绑定的案例和附件通过 `.gitattributes` 保留原始字节。

`scripts/build_multiformat_evidence.py` 生成合成附件，PDF 使用可复现元数据；图片定位是固定演练样例。视觉改动后需要检查文字和定位仍匹配，不能仅更新哈希。

## 修改规则

界面只展示服务返回的业务结果。不能在前端伪造验证、审批、真实模型输出或外部成功状态。任何改变输入或快照的路径都要核查旧审批失效行为。详细工程约束见 `AGENTS.md`，视觉系统见 `DESIGN.md`。
