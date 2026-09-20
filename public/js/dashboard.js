/**
 * Admin dashboard chart initialization.
 * Uses Chart.js loaded via CDN.
 */
document.addEventListener('DOMContentLoaded', () => {
  initCategoryChart();
  initMonthlyChart();
});

function initCategoryChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const data = JSON.parse(canvas.getAttribute('data-chart') || '[]');
  if (!data.length) return;

  const colors = [
    '#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706',
    '#dc2626', '#2563eb', '#db2777', '#84cc16', '#f97316',
    '#06b6d4', '#8b5cf6',
  ];

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d._id),
      datasets: [{
        data: data.map((d) => d.count),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8,
            font: { family: 'Inter', size: 12 },
          },
        },
      },
      cutout: '65%',
    },
  });
}

function initMonthlyChart() {
  const canvas = document.getElementById('monthly-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const data = JSON.parse(canvas.getAttribute('data-chart') || '[]');
  if (!data.length) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = data.map((d) => `${months[d._id.month - 1]} ${d._id.year}`);
  const counts = data.map((d) => d.count);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Books Borrowed',
        data: counts,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { family: 'Inter', size: 11 },
          },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
      },
    },
  });
}
