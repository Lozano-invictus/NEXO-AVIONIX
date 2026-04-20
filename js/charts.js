/**
 * Nexo Avionix — Gestión de Gráficos (Chart.js)
 */

import { state } from './state.js';

let charts = {};

/**
 * Inicializa todos los gráficos del panel admin
 */
export function initAdminCharts() {
  initFlightsChart();
  initBookingsChart();
  initReportsCharts();
}

function initFlightsChart() {
  const ctx = document.getElementById('chart-flights');
  if (!ctx) return;

  const scheduled = state.adminFlights.filter(f => f.status === 'scheduled').length;
  const inAir = state.adminFlights.filter(f => f.status === 'in-air').length;
  const landed = state.adminFlights.filter(f => f.status === 'landed').length;

  charts.flights = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Programados', 'En Aire', 'Aterrizados'],
      datasets: [{
        label: 'Vuelos',
        data: [scheduled, inAir, landed],
        backgroundColor: [
          'rgba(69, 123, 157, 0.7)',
          'rgba(168, 218, 220, 0.7)',
          'rgba(29, 53, 87, 0.7)'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { display: false } } }
    }
  });
}

function initBookingsChart() {
  const ctx = document.getElementById('chart-bookings');
  if (!ctx) return;

  const paid = state.bookings.filter(b => b.payment === 'paid').length;
  const pending = state.bookings.filter(b => b.payment === 'pending').length;

  charts.bookings = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pagado', 'Pendiente'],
      datasets: [{
        data: [paid, pending],
        backgroundColor: ['#2e7d32', '#f57c00'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function initReportsCharts() {
  const ctxRev = document.getElementById('chart-reports-revenue');
  const ctxOcc = document.getElementById('chart-reports-occupancy');
  
  if (ctxRev) {
    charts.revenue = new Chart(ctxRev, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Ingresos (Millones COP)',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: '#457b9d',
          backgroundColor: 'rgba(69, 123, 157, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  if (ctxOcc) {
    charts.occupancy = new Chart(ctxOcc, {
      type: 'radar',
      data: {
        labels: ['BOG-CTG', 'BOG-ADZ', 'MDE-SMR', 'CLO-BOG', 'BOG-MDE'],
        datasets: [{
          label: '% Ocupación Promedio',
          data: [92, 85, 78, 88, 95],
          backgroundColor: 'rgba(230, 57, 70, 0.2)',
          borderColor: '#e63946',
          pointBackgroundColor: '#e63946'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

/**
 * Actualiza los datos de los gráficos existentes
 */
export function updateCharts() {
  if (charts.flights) {
    const scheduled = state.adminFlights.filter(f => f.status === 'scheduled').length;
    const inAir = state.adminFlights.filter(f => f.status === 'in-air').length;
    const landed = state.adminFlights.filter(f => f.status === 'landed').length;
    charts.flights.data.datasets[0].data = [scheduled, inAir, landed];
    charts.flights.update();
  }

  if (charts.bookings) {
    const paid = state.bookings.filter(b => b.payment === 'paid').length;
    const pending = state.bookings.filter(b => b.payment === 'pending').length;
    charts.bookings.data.datasets[0].data = [paid, pending];
    charts.bookings.update();
  }
}
