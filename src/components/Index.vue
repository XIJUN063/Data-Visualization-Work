<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-icon>
          <MagicStick />
        </el-icon>
        23-24赛季英超球员数据可视化系统
      </el-header>
      <el-container>
        <!-- 左侧边栏 -->
        <el-aside width="200px">
          <el-menu class="el-menu-vertical-demo" :default-openeds="openeds" :default-active="activeIndex">
            <!-- 消费者洞察 -->
            <el-sub-menu index="1">
              <template #title>
                <el-icon>
                  <Menu />
                </el-icon>
                <span>球员数据分析</span>
              </template>
              <router-link to="/user">
                <el-menu-item index="1-1">
                  球员自身数据分析
                </el-menu-item>
              </router-link>
            </el-sub-menu>
            <!-- 球员分析 -->
            <el-sub-menu index="2">
              <template #title>
                <el-icon>
                  <Folder />
                </el-icon>
                <span>球员比赛洞察</span>
              </template>
              <router-link to="/order"> <el-menu-item index="2-2">
                个人比赛详细数据合集
                </el-menu-item>
              </router-link>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        <!-- 主体区域 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { Folder, Menu, MagicStick } from '@element-plus/icons-vue'
import { ref } from 'vue'
// 默认展开导航栏
const openeds = ref(['1', '2']);
const activeIndex = ref('1-1')
</script>
<style  lang="scss">
.el-container {
  margin: 0;
  height: 100%;

  .el-header {
    background-color: rgb(1, 84, 125);
    color: white;
    line-height: 60px;
    font-size: larger;
  }

  .el-container {
    .el-menu {
      height: 100%;
    }
  }
}
</style>