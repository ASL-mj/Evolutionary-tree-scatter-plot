# 生物信息可视化组件库

这是一个用于生物信息数据可视化的 React 组件库，包含 PCA 分析、进化树和群体结构分析等功能。

## 目录结构

src/
├── components/
│ ├── Dashboard.jsx # 总览页面，整合所有组件
│ ├── PCATable.jsx # 样本信息表格组件
│ ├── PCAScatter.jsx # PCA 散点图组件
│ ├── PhylogeneticTree.jsx # 进化树组件
│ ├── StackedBarChart.jsx # 群体结构分析组件
│ └── EchartsDemo.jsx # PCA 分析独立页面
├── App.css # 全局样式
└── App.jsx # 路由配置

## 组件说明

### 1. Dashboard
主面板组件，整合了所有可视化组件，负责组件间的数据流转。

**用途：**
- 提供整体布局
- 管理组件间的数据共享
- 处理样本选择状态

**使用方法：**

sx
<Dashboard />

### 2. PCATable
样本信息表格组件，用于展示和选择样本。

**功能：**
- 展示样本基本信息
- 支持搜索过滤
- 支持排序
- 支持多选

**Props：**
- `onSelectionChange: (selectedIds: string[]) => void` - 选择变化回调
- `onDataLoaded: (data: object[]) => void` - 数据加载完成回调

**使用方法：**

```jsx
<PCATable 
  onSelectionChange={setSelectedSamples}
  onDataLoaded={setTableData}
/>
```

### 3. PCAScatter
PCA 散点图组件，展示 PCA 分析结果。

**功能：**
- 展示 PC1-PC2、PC1-PC3、PC2-PC3 散点图
- 支持图表下载
- 支持图表刷新
- 悬停显示样本详情

**Props：**
- `selectedSamples: string[]` - 选中的样本 ID 列表
- `tableData: object[]` - 样本详细信息

**使用方法：**
```jsx
<PCAScatter 
  selectedSamples={selectedSamples}
  tableData={tableData}
/>
```

### 4. PhylogeneticTree
进化树可视化组件。

**功能：**
- 展示进化树结构
- 支持样本过滤
- 支持节点高亮
- 支持导出 SVG
- 悬停显示节点信息

**Props：**
- `selectedSamples: string[]` - 选中的样本 ID 列表
- `tableData: object[]` - 样本详细信息

**使用方法：**
```jsx
<PhylogeneticTree 
  selectedSamples={selectedSamples}
  tableData={tableData}
/>
```

### 5. StackedBarChart
群体结构分析组件。

**功能：**
- 展示群体结构堆叠柱状图
- 支持不同 K 值切换
- 支持图表下载
- 支持样本过滤

**Props：**
- `selectedSamples: string[]` - 选中的样本 ID 列表
- `tableData: object[]` - 样本详细信息

**使用方法：**
```jsx
<StackedBarChart 
  selectedSamples={selectedSamples}
  tableData={tableData}
/>
```

## 数据流动

1. PCATable 加载 Excel 数据并触发 onDataLoaded
2. Dashboard 接收并存储表格数据
3. 用户在表格中选择样本，触发 onSelectionChange
4. Dashboard 更新选中样本状态
5. 其他组件接收新的选中样本和表格数据并更新视图

## 集成指南

### 1. 安装依赖
```bash
npm install antd d3 echarts echarts-for-react xlsx
```

### 2. 复制组件文件
将需要的组件文件复制到你的项目中。

### 3. 准备数据文件
在 public 目录下准备以下数据文件：
- `重测序整理的样本信息.xlsx` - 样本信息表
- `pca.eigenvec` - PCA 分析结果
- `treebest_NJ.treeout.newick` - 进化树数据
- `k*.Q` - 群体结构数据（k2.Q ~ k5.Q）

### 4. 添加样式
将 App.css 中的相关样式复制到你的项目中。

### 5. 使用组件
```jsx
import { Dashboard } from './components'

function App() {
  return (
    <div className="app">
      <Dashboard />
    </div>
  )
}
```

## 注意事项

1. 所有组件都依赖于正确格式的数据文件
2. 样本 ID 在不同数据文件中需要保持一致
3. 组件使用了 antd 组件库的样式
4. 图表尺寸会自适应容器大小
5. 建议在较大屏幕上使用

## 自定义配置

1. 修改样式：通过 CSS 类名覆盖默认样式
2. 修改布局：调整 Dashboard 中的 Grid 配置
3. 修改颜色：更新各组件中的颜色配置
4. 修改数据源：更新各组件中的数据加载路径

