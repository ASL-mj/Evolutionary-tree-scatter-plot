# 生物信息数据可视化平台

一个基于 React + Vite 构建的生物信息可视化前端项目，用于展示样本信息表、PCA 散点图、群体结构分析图和进化树结果，并支持按样本联动筛选。

## 项目特性

- 样本信息表展示与搜索、排序、批量选择
- PCA 散点图展示，支持不同主成分组合切换
- 群体结构分析图展示，支持不同 K 值切换
- 进化树可视化，支持按已选样本过滤与导出
- 多个图表之间通过样本选择联动

## 技术栈

- React 18
- Vite 6
- Ant Design
- ECharts / echarts-for-react
- D3.js
- xlsx
- React Router

## 页面说明

项目当前包含以下页面：

- `数据总览 /`：整合样本表、PCA、进化树、群体结构图的总览页面
- `PCA 分析 /pca`：左侧样本表，右侧 PCA 散点图
- `群体结构统计 /stacked`：群体结构堆叠柱状图
- `进化树 /tree`：基于 Newick 数据绘制的进化树
- `新进化树 /newtree`：单独的树图演示页面，支持分支长度显示切换

## 目录结构

```text
.
├── public/
│   ├── pca.eigenvec
│   ├── treebest_NJ.treeout.newick
│   ├── life.txt
│   ├── k2.Q ~ k5.Q
│   └── 重测序整理的样本信息.xlsx
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── PCATable.jsx
│   │   ├── PCAScatter.jsx
│   │   ├── StackedBarChart.jsx
│   │   ├── PhylogeneticTree.jsx
│   │   ├── EchartsDemo.jsx
│   │   └── NewTree.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## 安装与运行

### 1. 安装依赖

任选一种方式：

```bash
npm install
```

或

```bash
yarn install
```

### 2. 启动开发环境

```bash
npm run dev
```

### 3. 打包构建

```bash
npm run build
```

### 4. 本地预览构建结果

```bash
npm run preview
```

## 数据文件说明

当前项目直接从 `public/` 目录读取静态数据文件，文件名是写死在组件中的，因此运行前需要确保这些文件存在且命名一致。

主要数据文件如下：

- `重测序整理的样本信息.xlsx`：样本基础信息表
- `pca.eigenvec`：PCA 结果文件
- `treebest_NJ.treeout.newick`：进化树数据
- `k2.Q`、`k3.Q`、`k4.Q`、`k5.Q`：不同 K 值的群体结构分析数据
- `life.txt`：`/newtree` 页面使用的树图数据

## 交互逻辑

项目的核心交互是“样本选择联动”：

1. 样本表读取 Excel 数据并展示样本列表
2. 用户在表格中搜索、筛选、勾选样本
3. 已选样本同步传递给 PCA、进化树和群体结构图
4. 图表仅展示当前选中的样本结果

## 主要组件说明

### `PCATable.jsx`

- 读取 Excel 样本表
- 支持搜索、排序、全选/全不选
- 输出当前选中的样本 ID

### `PCAScatter.jsx`

- 读取 `pca.eigenvec`
- 支持 `PC1-PC2`、`PC1-PC3`、`PC2-PC3` 切换
- 支持图像下载与刷新

### `StackedBarChart.jsx`

- 读取 `k2.Q ~ k5.Q`
- 支持不同 K 值切换
- 支持图像下载与刷新

### `PhylogeneticTree.jsx`

- 读取 `treebest_NJ.treeout.newick`
- 使用 D3 绘制进化树
- 支持样本过滤、节点悬停信息和 SVG 导出

### `NewTree.jsx`

- 读取 `life.txt`
- 用于展示另一种树图交互形式
- 支持切换是否显示分支长度

## 注意事项

- 样本 ID 在 Excel、PCA、群体结构和进化树文件之间需要保持一致
- 组件内部会将样本名中的 `-` 规范化为 `_`，以便跨数据文件匹配
- 当前数据源路径和文件名为硬编码，如需替换数据，需要同步修改对应组件中的 `fetch` 路径
- 项目更偏向内部数据展示场景，上传 GitHub 时建议补充示例截图和数据说明

## 后续可优化方向

- 增加上传自定义数据文件的能力，而不是依赖固定文件名
- 为图表补充图例、筛选项和导出配置
- 将数据读取逻辑抽离成统一的数据服务层
- 补充 README 截图、示例数据格式说明和部署方式

## License

如需开源发布，建议补充项目许可证，例如 MIT License。
