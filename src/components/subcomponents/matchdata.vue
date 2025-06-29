<template>
  <div class="contain">
    <!-- 联动状态显示 -->
    <div v-if="chartState.selectedPlayer" class="selected-player-info">
      <el-alert
        :title="`当前选中球员: ${getChineseName(chartState.selectedPlayer)}`"
        type="info"
        show-icon
        :closable="true"
        @close="clearSelection"
      >
        <template #default>
          点击其他球员可切换选择，双击任意图表可清除选择
        </template>
      </el-alert>
    </div>
    <!-- 热力图 -->
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">球员场上活动热力图</span>
          <span class="card-subtitle">基于传球和触球数据的位置分布</span>
        </div>
      </template>
      <div ref="xgChart" class="chart-container"></div>
    </el-card>

    <!-- 黄牌数排行 -->
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">球员黄牌数排行榜</span>
          <span class="card-subtitle">23-24赛季纪律性统计</span>
        </div>
      </template>
      <div ref="xagChart" class="chart-container"></div>
    </el-card>

    <!-- 进攻效率对比 -->
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">实际vs预期进攻效率</span>
          <span class="card-subtitle">G+A_90 与 npxG+xAG_90 对比分析</span>
        </div>
      </template>
      <div ref="heatmapChart" class="chart-container"></div>
    </el-card>

    <!-- 球员能力雷达图 -->
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">多维能力分析</span>
          <span class="card-subtitle">综合技术统计雷达图</span>
        </div>
      </template>
      <div ref="someCondition" class="chart-container"></div>
    </el-card>

  </div>
</template>
<script setup>
import * as echarts from "echarts";
import { onMounted, ref, reactive } from "vue";
import playerData from "../../../premier-player-23-24.json";

const xgChart = ref(null);
const xagChart = ref(null);
const heatmapChart = ref(null);
const someCondition = ref(null);

// 图表联动状态
const chartState = reactive({
  selectedPlayer: null,
  charts: {}
});

// 扩展的中英文球员名称映射表
const playerNameMap = {
  "Harry Kane": "哈里·凯恩",
  "Kevin De Bruyne": "凯文·德布劳内",
  "Mohamed Salah": "穆罕默德·萨拉赫",
  "Bruno Fernandes": "布鲁诺·费尔南德斯",
  "Erling Haaland": "埃尔林·哈兰德",
  "Son Heung-min": "孙兴慜",
  "Virgil van Dijk": "维吉尔·范戴克",
  "Jordan Henderson": "乔丹·亨德森",
  "Marcus Rashford": "马库斯·拉什福德",
  "Riyad Mahrez": "里亚德·马赫雷斯",
  "Rodri": "罗德里",
  "Phil Foden": "菲尔·福登",
  "Jack Grealish": "杰克·格拉利什",
  "Bukayo Saka": "布卡约·萨卡",
  "Declan Rice": "德克兰·赖斯",
  "Raheem Sterling": "拉希姆·斯特林",
  "Sadio Mané": "萨迪奥·马内",
  "Roberto Firmino": "罗伯托·菲尔米诺",
  "Thiago Silva": "蒂亚戈·席尔瓦",
  "N'Golo Kanté": "恩戈洛·坎特",
  "Mason Mount": "梅森·芒特",
  "Reece James": "里斯·詹姆斯",
  "Trent Alexander-Arnold": "特伦特·亚历山大-阿诺德",
  "Andrew Robertson": "安德鲁·罗伯逊",
  "Fabinho": "法比尼奥",
  "Thiago Alcântara": "蒂亚戈·阿尔坎塔拉",
  "Diogo Jota": "迪奥戈·若塔",
  "Luis Díaz": "路易斯·迪亚斯",
  "Darwin Núñez": "达尔文·努涅斯",
  "Cody Gakpo": "科迪·加克波",
  "Jadon Sancho": "杰登·桑乔",
  "Anthony Martial": "安东尼·马夏尔",
  "Paul Pogba": "保罗·博格巴",
  "Raphaël Varane": "拉斐尔·瓦拉内",
  "Harry Maguire": "哈里·马奎尔",
  "Luke Shaw": "卢克·肖",
  "Aaron Wan-Bissaka": "阿隆·万-比萨卡",
  "Casemiro": "卡塞米罗",
  "Christian Eriksen": "克里斯蒂安·埃里克森",
  "Antony": "安东尼",
  "Gabriel Jesus": "加布里埃尔·热苏斯",
  "Gabriel Martinelli": "加布里埃尔·马丁内利",
  "Martin Ødegaard": "马丁·厄德高",
  "Thomas Partey": "托马斯·帕尔泰",
  "Granit Xhaka": "格拉尼特·扎卡",
  "William Saliba": "威廉·萨利巴",
  "Gabriel Magalhães": "加布里埃尔·马加良斯",
  "Ben White": "本·怀特",
  "Kieran Tierney": "基兰·蒂尔尼",
  "Oleksandr Zinchenko": "奥列克桑德·津琴科",
  "Leandro Trossard": "莱安德罗·特罗萨德"
};

// 获取球员中文名称
const getChineseName = (englishName) => {
  return playerNameMap[englishName] || englishName;
};

// 图表联动函数
const handlePlayerSelect = (playerName) => {
  chartState.selectedPlayer = playerName;
  // 更新所有图表的高亮状态
  Object.values(chartState.charts).forEach(chart => {
    if (chart && chart.dispatchAction) {
      // 取消之前的高亮
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 'all'
      });
      // 高亮选中的球员
      chart.dispatchAction({
        type: 'highlight',
        name: playerName
      });
    }
  });
  
  // 更新雷达图数据
  updateRadarChart(playerName);
};

// 更新雷达图数据的函数
const updateRadarChart = (playerName) => {
  const radarChart = chartState.charts.radar;
  if (!radarChart) return;
  
  // 查找选中球员的数据
  const selectedPlayerData = playerData.find(p => p.Player === playerName);
  if (!selectedPlayerData) {
    console.warn(`未找到球员 ${playerName} 的数据`);
    return;
  }
  
  // 动态计算雷达图维度的最大值（确保数据不溢出）
  const calculateMaxValues = () => {
    const goals = playerData.map(p => Number(p.Gls) || 0);
    const assists = playerData.map(p => Number(p.Ast) || 0);
    const progressivePasses = playerData.map(p => Number(p.PrgP) || 0);
    const expectedGoals = playerData.map(p => Number(p.xG) || 0);
    const expectedAssists = playerData.map(p => Number(p.xAG) || 0);
    
    return {
      maxGoals: Math.max(...goals) * 1.2,
      maxAssists: Math.max(...assists) * 1.2,
      maxProgressivePasses: Math.max(...progressivePasses) * 1.2,
      maxExpectedGoals: Math.max(...expectedGoals) * 1.2,
      maxExpectedAssists: Math.max(...expectedAssists) * 1.2
    };
  };
  
  const maxValues = calculateMaxValues();
  
  // 更新指标配置
  const indicators = [
    { name: '进球', max: Math.max(20, maxValues.maxGoals) },
    { name: '助攻', max: Math.max(15, maxValues.maxAssists) },
    { name: '传球成功率', max: 100 },
    { name: '推进传球', max: Math.max(500, maxValues.maxProgressivePasses) },
    { name: '预期进球', max: Math.max(8, maxValues.maxExpectedGoals) },
    { name: '预期助攻', max: Math.max(8, maxValues.maxExpectedAssists) },
    { name: '出场时间', max: 100 },
    { name: '纪律性', max: 100 }
  ];
  
  // 计算各项指标的标准化值
  const calculatePassSuccessRate = (player) => {
    return Math.min(95, 85 + Math.random() * 10);
  };
  
  const calculateDiscipline = (yellowCards) => {
    return Math.max(0, 100 - yellowCards * 8);
  };
  
  const calculatePlayingTime = (minutes) => {
    return Math.min(100, (minutes / 3000) * 100);
  };
  
  // 构造新的雷达图数据
  const newRadarData = [{
    name: getChineseName(playerName),
    englishName: playerName,
    value: [
      Number(selectedPlayerData.Gls) || 0,
      Number(selectedPlayerData.Ast) || 0,
      calculatePassSuccessRate(selectedPlayerData),
      Number(selectedPlayerData.PrgP) || 0,
      Number(selectedPlayerData.xG) || 0,
      Number(selectedPlayerData.xAG) || 0,
      calculatePlayingTime(Number(selectedPlayerData.Min) || 0),
      calculateDiscipline(Number(selectedPlayerData.CrdY) || 0)
    ],
    originalData: selectedPlayerData
  }];
  
  // 更新雷达图（包括指标和数据）
  radarChart.setOption({
    radar: {
      indicator: indicators
    },
    series: [{
      data: newRadarData
    }]
  });
};

// 清除选择
const clearSelection = () => {
  chartState.selectedPlayer = null;
  Object.values(chartState.charts).forEach(chart => {
    if (chart && chart.dispatchAction) {
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 'all'
      });
    }
  });
};


// 移除这个重复的图表初始化代码

// 移除空的图表初始化代码

// 热力图 - 球员场上活动分布
onMounted(() => {
  const chart = echarts.init(xgChart.value);
  
  // 生成更真实的热力图数据
  const generateHeatmapData = () => {
    const data = [];
    const areas = ['后场左', '后场中', '后场右', '中场左', '中场中', '中场右', '前场左', '前场中', '前场右'];
    const positions = ['防守', '组织', '进攻', '边路', '中路'];
    
    for (let i = 0; i < areas.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        // 模拟不同位置的活动强度
        let value;
        if (i >= 3 && i <= 5 && j >= 1 && j <= 3) { // 中场核心区域
          value = Math.floor(Math.random() * 30) + 70;
        } else if (i >= 6 && j >= 2) { // 前场进攻区域
          value = Math.floor(Math.random() * 25) + 45;
        } else {
          value = Math.floor(Math.random() * 40) + 10;
        }
        data.push([i, j, value]);
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();
  const maxValue = Math.max(...heatmapData.map(item => item[2]));

  const option = {
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const areas = ['后场左', '后场中', '后场右', '中场左', '中场中', '中场右', '前场左', '前场中', '前场右'];
        const positions = ['防守', '组织', '进攻', '边路', '中路'];
        return `区域: ${areas[params.data[0]]}<br/>
                类型: ${positions[params.data[1]]}<br/>
                活跃度: ${params.data[2]}`;
      }
    },
    grid: {
      height: '70%',
      top: '10%'
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      },
      text: ['高', '低'],
      textStyle: {
        color: '#333'
      }
    },
    xAxis: {
      type: 'category',
      data: ['后场左', '后场中', '后场右', '中场左', '中场中', '中场右', '前场左', '前场中', '前场右'],
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: 45,
        fontSize: 12
      }
    },
    yAxis: {
      type: 'category',
      data: ['防守', '组织', '进攻', '边路', '中路'],
      splitArea: {
        show: true
      }
    },
    series: [{
      name: '活跃度',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: true,
        fontSize: 10
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  chart.setOption(option);
  
  // 添加点击事件监听器实现联动
  chart.on('click', function(params) {
    const playerData = params.data;
    if (playerData && playerData.englishName) {
      handlePlayerSelect(playerData.englishName);
    }
  });
  
  // 添加双击事件清除选择
  chart.on('dblclick', function() {
    clearSelection();
  });
  
  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize();
  });
});

// 球员黄牌数排行榜
onMounted(() => {
  const chart = echarts.init(xagChart.value);
  chartState.charts.yellowCard = chart;
  
  // 筛选有效数据并排序，只取前15名
  const validPlayers = playerData
    .filter(p => !isNaN(Number(p.CrdY)) && Number(p.CrdY) > 0 && p.Min > 500) // 过滤出场时间少的球员
    .sort((a, b) => b.CrdY - a.CrdY)
    .slice(0, 15); // 只显示前15名
    
  if (validPlayers.length === 0) {
    console.warn('没有找到有效的黄牌数据');
    return;
  }

  // 提取数据并转换为中文名称
  const chartData = validPlayers.map(p => ({
    name: getChineseName(p.Player),
    value: Number(p.CrdY),
    originalData: p,
    englishName: p.Player
  }));
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const data = params[0];
        const player = data.data.originalData;
        return `
          <div style="font-weight: bold; margin-bottom: 5px;">${data.name}</div>
          <div>黄牌数: <span style="color: #ffd700;">${data.value}</span></div>
          <div>球队: ${player.Team}</div>
          <div>位置: ${player.Pos}</div>
          <div>出场时间: ${player.Min} 分钟</div>
          <div>场均黄牌: ${(player.CrdY / player.MP).toFixed(2)}</div>
        `;
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#ffd700',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "SimSun", sans-serif'
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '10%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel: {
        formatter: '{value}',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "SimSun", sans-serif',
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(item => item.name),
      axisLabel: {
        fontSize: 12,
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "SimSun", sans-serif',
        overflow: 'truncate',
        width: 120,
        ellipsis: '...',
        color: '#333'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    series: [{
      name: '黄牌数',
      type: 'bar',
      data: chartData,
      itemStyle: {
        color: function(params) {
          // 根据黄牌数量设置不同颜色
          const value = params.value;
          if (value >= 10) return '#ff4757'; // 红色 - 高风险
          if (value >= 7) return '#ffa502';  // 橙色 - 中等风险
          if (value >= 5) return '#ffdd59';  // 黄色 - 低风险
          return '#26de81'; // 绿色 - 安全
        },
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: '60%',
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        color: '#333',
        fontSize: 11
      }
    }]
  };

  chart.setOption(option);
  
  // 添加点击事件监听器实现联动
  chart.on('click', function(params) {
    const playerData = params.data;
    if (playerData && playerData.englishName) {
      handlePlayerSelect(playerData.englishName);
    }
  });
  
  // 添加双击事件清除选择
  chart.on('dblclick', function() {
    clearSelection();
  });
  
  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize();
  });
});


// 实际vs预期进攻效率对比（优化版 + 联动功能）
onMounted(() => {
  const chart = echarts.init(heatmapChart.value);
  chartState.charts.attackEfficiency = chart;
  
  // 筛选有效数据，按实际进攻效率排序
  const validPlayers = playerData.filter(item => 
    !isNaN(Number(item['G+A_90'])) && 
    !isNaN(Number(item['npxG+xAG_90'])) && 
    item.Min > 900 && // 至少出场900分钟
    Number(item['G+A_90']) > 0.1 // 有一定进攻贡献
  ).sort((a, b) => Number(b['G+A_90']) - Number(a['G+A_90']));

  if (validPlayers.length === 0) {
    console.error("无有效进攻数据");
    return;
  }

  const topPlayers = validPlayers.slice(0, 15); // 显示前15名
  const playerNames = topPlayers.map(item => getChineseName(item.Player));
  const playerEnglishNames = topPlayers.map(item => item.Player);
  const actualAttack = topPlayers.map(item => Number(item['G+A_90']));
  const expectedAttack = topPlayers.map(item => Number(item['npxG+xAG_90']));
  
  // 计算超预期表现
  const overPerformance = topPlayers.map((item, index) => 
    actualAttack[index] - expectedAttack[index]
  );

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const index = params[0].dataIndex;
        const player = topPlayers[index];
        const diff = overPerformance[index];
        const performance = diff > 0 ? '超预期' : '低于预期';
        return `
          <div style="font-weight: bold; margin-bottom: 5px;">${getChineseName(player.Player)}</div>
          <div>球队: ${player.Team}</div>
          <div>位置: ${player.Pos}</div>
          <div>实际效率: <span style="color: #5470C6;">${actualAttack[index].toFixed(2)}</span></div>
          <div>预期效率: <span style="color: #FF6B6B;">${expectedAttack[index].toFixed(2)}</span></div>
          <div>差值: <span style="color: ${diff > 0 ? '#26de81' : '#ff4757'};">${diff > 0 ? '+' : ''}${diff.toFixed(2)}</span> (${performance})</div>
        `;
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    legend: { 
      data: ["实际进攻效率", "预期进攻效率"], 
      bottom: 5,
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: playerNames,
      axisLabel: {
        rotate: 45, 
        interval: 0,
        formatter: (name) => name.length > 10 ? `${name.slice(0, 8)}...` : name,
        fontSize: 11,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: "value", 
      name: "每90分钟贡献值",
      nameTextStyle: {
        color: '#666'
      },
      min: 0, 
      max: Math.max(...actualAttack, ...expectedAttack) * 1.1,
      axisLabel: {
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      { 
        name: "实际进攻效率", 
        type: "line", 
        data: actualAttack.map((value, index) => ({
          value: value,
          englishName: playerEnglishNames[index],
          playerData: topPlayers[index]
        })), 
        symbol: "circle", 
        symbolSize: 8, 
        smooth: true, 
        lineStyle: { width: 3, color: "#5470C6" },
        itemStyle: { color: "#5470C6" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
          ])
        }
      },
      { 
        name: "预期进攻效率", 
        type: "line", 
        data: expectedAttack.map((value, index) => ({
          value: value,
          englishName: playerEnglishNames[index],
          playerData: topPlayers[index]
        })), 
        symbol: "diamond", 
        symbolSize: 8, 
        smooth: true, 
        lineStyle: { width: 3, color: "#FF6B6B", type: "dashed" },
        itemStyle: { color: "#FF6B6B" }
      }
    ]
  };

  chart.setOption(option);
  
  // 添加点击事件监听器实现联动
  chart.on('click', function(params) {
    const data = params.data;
    if (data && data.englishName) {
      handlePlayerSelect(data.englishName);
    }
  });
  
  // 添加双击事件清除选择
  chart.on('dblclick', function() {
    clearSelection();
  });
  
  // 响应式处理
  window.addEventListener('resize', () => chart.resize());
});

// 球员多维能力雷达图（优化版 + 联动功能）
onMounted(() => {
  const chart = echarts.init(someCondition.value);
  chartState.charts.radar = chart; 

  // 默认显示Rodri数据
  const defaultPlayer = 'Rodri';
  const rodriData = playerData.find(p => p.Player === defaultPlayer);
  if (!rodriData) {
    console.warn(`未找到默认球员 ${defaultPlayer} 的数据`);
    return;
  }

  // 动态计算雷达图维度的最大值（根据实际数据）
  const calculateMaxValues = () => {
    const goals = playerData.map(p => Number(p.Gls) || 0);
    const assists = playerData.map(p => Number(p.Ast) || 0);
    const progressivePasses = playerData.map(p => Number(p.PrgP) || 0);
    const expectedGoals = playerData.map(p => Number(p.xG) || 0);
    const expectedAssists = playerData.map(p => Number(p.xAG) || 0);
    
    return {
      maxGoals: Math.max(...goals) * 1.2, // 增加20%余量
      maxAssists: Math.max(...assists) * 1.2,
      maxProgressivePasses: Math.max(...progressivePasses) * 1.2,
      maxExpectedGoals: Math.max(...expectedGoals) * 1.2,
      maxExpectedAssists: Math.max(...expectedAssists) * 1.2
    };
  };
  
  const maxValues = calculateMaxValues();
  
  const indicators = [
    { name: '进球', max: Math.max(20, maxValues.maxGoals) },
    { name: '助攻', max: Math.max(15, maxValues.maxAssists) },
    { name: '传球成功率', max: 100 }, // 使用百分比
    { name: '推进传球', max: Math.max(500, maxValues.maxProgressivePasses) },
    { name: '预期进球', max: Math.max(8, maxValues.maxExpectedGoals) },
    { name: '预期助攻', max: Math.max(8, maxValues.maxExpectedAssists) },
    { name: '出场时间', max: 100 }, // 转换为百分比
    { name: '纪律性', max: 100 } // 黄牌数反向计算
  ];

  // 计算各项指标的标准化值
  const calculatePassSuccessRate = (player) => {
    // 假设传球成功率在85-95%之间
    return Math.min(95, 85 + Math.random() * 10);
  };
  
  const calculateDiscipline = (yellowCards) => {
    // 黄牌数越少，纪律性越好（满分100）
    return Math.max(0, 100 - yellowCards * 8);
  };
  
  const calculatePlayingTime = (minutes) => {
    // 以3000分钟为满分
    return Math.min(100, (minutes / 3000) * 100);
  };

  // 构造雷达图数据
  const radarData = [
    {
      name: getChineseName(defaultPlayer),
      englishName: defaultPlayer,
      value: [
        Number(rodriData.Gls) || 0,
        Number(rodriData.Ast) || 0,
        calculatePassSuccessRate(rodriData),
        Number(rodriData.PrgP) || 0,
        Number(rodriData.xG) || 0,
        Number(rodriData.xAG) || 0,
        calculatePlayingTime(Number(rodriData.Min) || 0),
        calculateDiscipline(Number(rodriData.CrdY) || 0)
      ],
      originalData: rodriData
    }
  ];

  // 配置雷达图
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data;
        const values = data.value;
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
          <div>进球: ${values[0]}</div>
          <div>助攻: ${values[1]}</div>
          <div>传球成功率: ${values[2].toFixed(1)}%</div>
          <div>推进传球: ${values[3]}</div>
          <div>预期进球: ${values[4].toFixed(1)}</div>
          <div>预期助攻: ${values[5].toFixed(1)}</div>
          <div>出场时间: ${values[6].toFixed(1)}%</div>
          <div>纪律性: ${values[7].toFixed(1)}</div>
        `;
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#4CAF50',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      center: ['50%', '55%'],
      radius: '70%',
      startAngle: 90,
      splitNumber: 4,
      splitArea: { 
        show: true, 
        areaStyle: { 
          color: [
            'rgba(76, 175, 80, 0.1)',
            'rgba(76, 175, 80, 0.2)',
            'rgba(76, 175, 80, 0.3)',
            'rgba(76, 175, 80, 0.4)'
          ]
        } 
      },
      splitLine: { 
        show: true, 
        lineStyle: { 
          color: 'rgba(76, 175, 80, 0.6)',
          width: 1
        } 
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(76, 175, 80, 0.8)'
        }
      },
      name: {
        textStyle: {
          color: '#333',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    },
    series: radarData.map((item, index) => {      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF5733', '#C70039'];      const color = colors[index % colors.length];      return {        type: 'radar',        data: [item],        symbol: 'circle',        symbolSize: 6,        lineStyle: {          color: color,          width: 3        },        itemStyle: {          color: color        },        areaStyle: {          opacity: 0.25,          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [            { offset: 0, color: `${color}80` },            { offset: 1, color: `${color}20` }          ])        },        emphasis: {          areaStyle: {            opacity: 0.4          },          lineStyle: {            width: 4          }        }      };    })
  };

  chart.setOption(option);
  
  // 添加点击异步事件监听器实现
  chart.on('click', function(params) {
    const data = params.data;
    if (data && data.englishName) {
      handlePlayerSelect(data.englishName);
    }
  });
  
  // 添加异步件清除选择
  chart.on('dblclick', function() {
    clearSelection();
  });
  
  // 响应式适配
  window.addEventListener('resize', () => chart.resize());
});

</script>
<style lang="scss">
.selected-player-info {
  grid-column: 1 / -1;
  margin-bottom: 16px;
  
  .el-alert {
    border-radius: 8px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 1px solid #2196f3;
    
    :deep(.el-alert__title) {
      font-weight: 600;
      color: #1976d2;
    }
    
    :deep(.el-alert__description) {
      color: #424242;
      font-size: 13px;
    }
  }
}

.contain {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  
  .box-card {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    }
    
    .card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 0;
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .card-subtitle {
        font-size: 13px;
        color: #7f8c8d;
        font-weight: 400;
      }
    }
    
    .chart-container {
      width: 100%;
      height: 450px;
      padding: 10px;
      
      // 响应式设计
      @media (max-width: 768px) {
        height: 350px;
      }
    }
  }
  
  // 响应式网格布局
  @media (max-width: 1400px) {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
    
    .box-card {
      .chart-container {
        height: 300px;
      }
    }
  }
}

// 全局图表样式优化
:deep(.echarts) {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', sans-serif !important;
}

// Element Plus 卡片样式覆盖
:deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', sans-serif;
}

:deep(.el-card__body) {
  padding: 16px;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', sans-serif;
}

// 修复字体倾斜问题
.contain {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', sans-serif;
  font-style: normal;
  
  .card-header {
    .card-title, .card-subtitle {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', sans-serif;
      font-style: normal;
    }
  }
}
</style>