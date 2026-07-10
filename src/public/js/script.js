

(function () {
  "use strict";

  const POLL_INTERVAL_MS = 1000;

  let chartInstance = null;
  let lastUsageSnapshot = null;

  function revealPage() {
    const page = document.getElementById("page");
    if (!page) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        page.classList.add("is-visible");
      });
    });
  }

  function normalizeUsage(rawUsage) {
    const safeUsage = Array.isArray(rawUsage) ? rawUsage : [];

    const labels = safeUsage.map((item) => formatDate(item.day));
    const values = safeUsage.map((item) => Number(item.tokens) || 0);

    return { labels, values, raw: safeUsage };
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";

    const date = new Date(`${isoDate}T00:00:00`);
    if (isNaN(date.getTime())) return isoDate;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  }

  function formatCompact(num) {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("pt-BR").format(num);
  }

  function updateStats(values, labels) {
    const totalEl = document.getElementById("stat-total");
    const avgEl = document.getElementById("stat-average");
    const peakEl = document.getElementById("stat-peak");
    const peakHintEl = document.getElementById("stat-peak-hint");
    const totalHintEl = document.getElementById("stat-total-hint");

    if (!values.length) {
      [totalEl, avgEl, peakEl].forEach((el) => {
        if (el) el.textContent = "—";
      });
      return;
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const average = Math.round(total / values.length);
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);

    if (totalEl) totalEl.textContent = formatNumber(total);
    if (avgEl) avgEl.textContent = formatNumber(average);
    if (peakEl) peakEl.textContent = formatNumber(peak);

    if (totalHintEl) {
      totalHintEl.textContent = `${values.length} dia${values.length > 1 ? "s" : ""} monitorados`;
    }
    if (peakHintEl && labels[peakIndex]) {
      peakHintEl.textContent = `Registrado em ${labels[peakIndex]}`;
    }
  }

  function updateTrend(values) {
    const latestEl = document.getElementById("chart-latest-value");
    const trendEl = document.getElementById("chart-trend");
    const trendValueEl = document.getElementById("chart-trend-value");

    if (!values.length) {
      if (latestEl) latestEl.textContent = "—";
      if (trendEl) trendEl.style.display = "none";
      return;
    }

    const latest = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : null;

    if (latestEl) latestEl.textContent = formatNumber(latest);

    if (!trendEl || !trendValueEl || previous === null || previous === 0) {
      if (trendEl) trendEl.style.display = "none";
      return;
    }

    trendEl.style.display = "inline-flex";

    const diff = latest - previous;
    const percent = (diff / previous) * 100;
    const isUp = diff >= 0;

    trendEl.classList.remove("is-up", "is-down");
    trendEl.classList.add(isUp ? "is-up" : "is-down");
    trendValueEl.textContent = `${Math.abs(percent).toFixed(1)}%`;
  }

  function showEmptyState(canvas, message) {
    const wrapper = canvas.closest(".chart-card__canvas-wrapper");
    if (!wrapper) return;

    canvas.style.display = "none";

    const empty = document.createElement("div");
    empty.className = "chart-empty-state";
    empty.textContent = message;
    wrapper.appendChild(empty);
  }

  function createChart(labels, values) {
    const canvas = document.getElementById("usageChart");
    if (!canvas) return null;

    if (typeof Chart === "undefined") {
      console.error(
        "[AI Usage Dashboard] Chart.js não foi carregado. Verifique se o CDN " +
          "https://cdn.jsdelivr.net/npm/chart.js está acessível."
      );
      showEmptyState(canvas, "Não foi possível carregar o gráfico.");
      return null;
    }

    if (!values.length) {
      console.warn(
        "[AI Usage Dashboard] A variável `usage` chegou vazia ao script.js. " +
          "Confira se o backend está passando os dados corretamente para o EJS."
      );
      showEmptyState(canvas, "Nenhum dado de consumo encontrado.");
      return null;
    }

    if (window.ChartDataLabels) {
      Chart.register(window.ChartDataLabels);
    }

    const ctx = canvas.getContext("2d");
    const chartHeight = canvas.parentElement.clientHeight || 360;

    const lineColor = "#3b82f6";
    const lineColorLight = "#60a5fa";

    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    gradient.addColorStop(0.65, "rgba(59, 130, 246, 0.06)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    Chart.defaults.font.family =
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    Chart.defaults.color = "#a1a1a1";

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tokens",
            data: values,
            borderColor: lineColor,
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            cubicInterpolationMode: "monotone",
            pointRadius: 3.5,
            pointBackgroundColor: "#000000",
            pointBorderColor: lineColor,
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: lineColorLight,
            pointHoverBorderColor: "#000000",
            pointHoverBorderWidth: 2,
            pointHitRadius: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        animation: {
          duration: 900,
          easing: "easeOutQuart",
        },
        layout: {
          padding: {
            top: 26, 
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#0a0a0a",
            titleColor: "#ededed",
            bodyColor: "#a1a1a1",
            borderColor: "rgba(255, 255, 255, 0.12)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            titleFont: { weight: "600", size: 12 },
            bodyFont: { size: 12, weight: "600" },
            callbacks: {
              label: (context) => `${formatNumber(context.parsed.y)} tokens`,
            },
          },
          datalabels: window.ChartDataLabels
            ? {
                align: "top",
                anchor: "end",
                offset: 8,
                color: "#ededed",
                font: {
                  size: 11,
                  weight: "600",
                },
                formatter: (value) => formatCompact(value),
                display: (context) => {
                  const totalPoints = context.dataset.data.length;
                  if (totalPoints <= 14) return true;
                  return context.dataIndex % Math.ceil(totalPoints / 14) === 0;
                },
              }
            : false,
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: "rgba(255, 255, 255, 0.09)" },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              font: { size: 11 },
              color: "#6e6e6e",
            },
          },
          y: {
            beginAtZero: true,
            grace: "15%",
            grid: {
              color: "rgba(255, 255, 255, 0.06)",
              drawTicks: false,
            },
            border: { display: false },
            ticks: {
              padding: 10,
              font: { size: 11 },
              color: "#6e6e6e",
              callback: (value) => formatCompact(value),
            },
          },
        },
      },
    });

    return chart;
  }

  function updateChart(labels, values) {
    if (!chartInstance) return;

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = values;
    chartInstance.update(); 
  }

  function updateLastUpdatedLabel() {
    const el = document.getElementById("last-updated");
    if (!el) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    el.textContent = `atualizado às ${time}`;
  }

  async function pollUsage() {

    try {

        const response = await fetch("/usage", {
            headers: {
                Accept: "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            console.warn(`[AI Usage Dashboard] GET /usage retornou ${response.status}`);
            return;
        }

        const result = await response.json();

        if (!result.success) {
            console.warn("[AI Usage Dashboard] API retornou erro.");
            return;
        }

        const usage = result.usage;

        const snapshot = JSON.stringify(usage);

        if (snapshot === lastUsageSnapshot) {
            return;
        }

        lastUsageSnapshot = snapshot;

        const { labels, values } = normalizeUsage(usage);

        updateChart(labels, values);
        updateStats(values, labels);
        updateTrend(values);
        updateLastUpdatedLabel();

        console.log("[AI Usage Dashboard] Dashboard atualizado.");

    } catch (err) {

        console.error("[AI Usage Dashboard]", err);

    }

}

  function startPolling() {
    setInterval(pollUsage, POLL_INTERVAL_MS);
  }

  function init() {
    revealPage();

    const initialUsage = typeof usage !== "undefined" ? usage : [];
    lastUsageSnapshot = JSON.stringify(initialUsage);

    const { labels, values } = normalizeUsage(initialUsage);

    updateStats(values, labels);
    updateTrend(values);
    chartInstance = createChart(labels, values);
    updateLastUpdatedLabel();

    startPolling();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
