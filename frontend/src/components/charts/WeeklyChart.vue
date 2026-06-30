<template>
  <div>
    <h2 class="text-xl font-bold mb-2">Weekly Learning Hours</h2>
    <canvas id="weeklyChart"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
import { getStudentId } from '../utils/studentId';

interface WeeklyProgress {
  date: string;
  minutes: number;
}

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip);

const studentId = getStudentId();
const bookId = 'BOOK456'; // replace dynamically from route
const weeklyData = ref<WeeklyProgress[]>([]);

const fetchWeeklyProgress = async () => {
  const res = await axios.get(`/api/progress/weekly/${studentId}/${bookId}`);
  weeklyData.value = res.data;
};

onMounted(async () => {
  await fetchWeeklyProgress();

  new Chart(document.getElementById('weeklyChart') as HTMLCanvasElement, {
    type: 'bar',
    data: {
      labels: weeklyData.value.map(d => d.date.slice(5)),
      datasets: [{
        label: 'Hours Spent',
        data: weeklyData.value.map(d => +(d.minutes / 60).toFixed(2)),
        backgroundColor: '#5F259F',
      }],
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Hours Per Day' } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Hours' } }
      }
    }
  });

  setInterval(fetchWeeklyProgress, 60000);
});
</script>

<style scoped>
canvas { width: 100% !important; height: 300px !important; }
</style>
