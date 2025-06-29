<template>
  <div class="contain">
    <el-card class="box-card">
      <div ref="xgChart" style="width: 100%; height: 400px"></div>
    </el-card>

    <el-card class="box-card">
      <div ref="xagChart" style="width: 100%; height: 400px"></div>
    </el-card>

    <el-card class="box-card">
      <div ref="heatmapChart" style="width: 100%; height: 400px"></div>
    </el-card>

    <el-card class="box-card">
      <div ref="someCondition" style="width: 100%; height: 400px"></div>
    </el-card>

  </div>
</template>
<script setup>
import * as echarts from "echarts";
import { onMounted, ref } from "vue";
import playerData from "../../../premier-player-23-24.json";

const xgChart = ref(null);
const xagChart = ref(null);
const heatmapChart = ref(null);
const someCondition = ref(null);
const newBarChart = ref(null);
const newRadarChart = ref(null);

// 1.球员年龄分布图
onMounted(() => {
  const chart = echarts.init(xgChart.value);
  const ages = playerData.map((item) => item.Age);
  const ageBins = [];
  for (let i = 15; i < 45; i += 5) {
    ageBins.push(`${i}-${i + 4}`);
  }
  const ageDistribution = ageBins.map((bin) => {
    const [min, max] = bin.split("-").map(Number);
    return playerData.filter((item) => item.Age >= min && item.Age < max)
      .length;
  });

  const option = {
    title: {
      text: "球员年龄分布图",
      right: "right",
      top: "top",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["年龄分布"],
    },
    xAxis: {
      type: "category",
      data: ageBins,
      name: "年龄区间",
    },
    yAxis: {
      type: "value",
      name: "球员数量",
    },
    series: [
      {
        name: "年龄分布",
        type: "bar",
        data: ageDistribution,
      },
    ],
  };

  chart.setOption(option);
});

// 2.球员进球数饼图
onMounted(() => {
  const chart = echarts.init(xagChart.value);
  const goals = playerData.map((item) => item.Gls);
  const maxGoals = Math.max(...goals);
  const binSize = Math.ceil(maxGoals / 5);
  const goalBins = [];
  for (let i = 0; i < maxGoals; i += binSize) {
    goalBins.push(`${i}-${i + binSize - 1}`);
  }
  const goalDistribution = goalBins.map((bin) => {
    const [min, max] = bin.split("-").map(Number);
    return playerData.filter((item) => item.Gls >= min && item.Gls <= max)
      .length;
  });

  const pieData = goalBins.map((bin, index) => {
    return {
      value: goalDistribution[index],
      name: bin,
    };
  });
  const option = {
    title: {
      text: "球员进球数分布图",
      right: "right",
      top: "top",
    },
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: goalBins,
    },
    series: [
      {
        name: "进球数目分布",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "30",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
      },
    ],
  };

  chart.setOption(option);
});



// 3.球员出场时间图
// 3. 球员出场时间分布（直方图+密度曲线版）
onMounted(() => {
  const chart = echarts.init(heatmapChart.value);

  // 1. 提取有效出场时间
  const minutes = playerData
    .map(item => item.Min)
    .filter(min => !isNaN(min) && min > 0);

  if (minutes.length === 0) {
    console.error("无有效出场时间数据");
    return;
  }

  // 2. 分箱处理（等距分10个区间）
  const binCount = 10; // 可调整分箱数
  const minMinutes = Math.min(...minutes);
  const maxMinutes = Math.max(...minutes);
  const binSize = Math.ceil((maxMinutes - minMinutes) / binCount);

  // 生成区间标签（优化最后一个区间的端点）
  const bins = [];
  for (let i = minMinutes; i <= maxMinutes; i += binSize) {
    const start = i;
    const end = Math.min(i + binSize, maxMinutes);
    bins.push(`${start}-${end}`);
  }

  // 3. 统计每个区间的球员数量
  const distribution = bins.map(bin => {
    const [start, end] = bin.split('-').map(Number);
    return minutes.filter(min => min >= start && min <= end).length;
  });

  // 4. 生成密度曲线数据（区间中点 + 数量）
  const binMidPoints = bins.map(bin => {
    const [start, end] = bin.split('-').map(Number);
    return (start + end) / 2; // 区间中点
  });
  const lineData = binMidPoints.map((mid, index) => [mid, distribution[index]]);

  // 5. ECharts配置（双x轴：类别轴+数值轴）
  const option = {
    title: { text: "球员出场时间分布（密度曲线）", left: "right" },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const barInfo = params.find(p => p.seriesType === 'bar');
        if (barInfo) {
          return `区间: ${bins[barInfo.dataIndex]}<br>数量: ${barInfo.value}`;
        }
      }
    },
    xAxis: [
      {
        type: "category",
        data: bins,
        name: "出场时间区间",
        axisLabel: {
          rotate: 45, // 旋转标签防重叠
          interval: 0 // 强制显示所有标签
        },
        position: "bottom"
      },
      {
        type: "value",
        show: false, // 隐藏数值轴，仅用于折线定位
        min: minMinutes,
        max: maxMinutes
      }
    ],
    yAxis: {
      type: "value",
      name: "球员数量"
    },
    series: [
      {
        name: "出场时间分布",
        type: "bar",
        data: distribution,
        xAxisIndex: 0, // 关联类别轴
        itemStyle: { color: "#5470C6" }
      },
      {
        name: "密度曲线",
        type: "line",
        data: lineData,
        smooth: true, // 平滑曲线
        areaStyle: {}, // 填充面积
        itemStyle: { color: "#FFC0CB" },
        xAxisIndex: 1, // 关联数值轴
        yAxisIndex: 0
      }
    ]
  };

  chart.setOption(option);
});


// 4.不同位置球员数量散点图
onMounted(() => {
  const chart = echarts.init(someCondition.value); 

  // 1. 定义位置映射（覆盖单一位置，复合位置后续拆分处理）
  const positionMap = {
    'GK': '门将',
    'DF': '后卫',
    'MF': '中场',
    'FW': '前锋'
  };

  // 2. 统计位置数量（处理复合位置的中文映射）
  const positionCount = playerData.reduce((acc, player) => {
    const originalPos = player.Pos; // 例如 "FW,MF"
    // 拆分复合位置，逐个映射为中文
    const chinesePosParts = originalPos.split(',').map(posPart => {
      return positionMap[posPart] || posPart; // 无映射的保留原缩写
    });
    const chinesePos = chinesePosParts.join('·'); // 用·连接更清晰（可替换为,）
    
    acc[chinesePos] = (acc[chinesePos] || 0) + 1;
    return acc;
  }, {});

  // 3. 提取中文位置和数量
  const positions = Object.keys(positionCount); // 中文位置（含复合，如"前锋·中场"）
  const counts = Object.values(positionCount);
  
  const scatterData = counts.map((count, index) => [index, count]);



  // 4. 配置图表
  const option = {
    title: { text: "不同位置球员数量分布", left: "right" },
    tooltip: {
      trigger: "item",
      formatter: (params) => 
        `位置: ${positions[params.data[0]]}<br>数量: ${params.data[1]}`
    },
    xAxis: {
      type: "category",
      data: positions,
      name: "球员位置",
      axisLabel: { 
        rotate: 45,   // 旋转标签避免重叠
        interval: 0,  // 强制显示所有标签
        fontSize: 12  // 可选：缩小字体
      }
    },
    yAxis: {
      type: "value",
      name: "球员数量"
    },
    series: [{
      type: "scatter",
      data: scatterData,
      symbolSize: 12,
      itemStyle: { color: "#5470C6" }
    }]
  };

  chart.setOption(option);
});

</script>
<style lang="scss">
.contain {
  display: flex;
  flex-wrap: wrap;

  .box-card {
    flex: 1;
    margin-bottom: 20px;
    margin-right: 20px;
    min-width: 500px;
    max-width: 800px;
  }
}
</style>
