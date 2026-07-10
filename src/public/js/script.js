

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

  function getModalEls() {
    return {
      overlay: document.getElementById("delete-modal-overlay"),
      input: document.getElementById("delete-modal-input"),
      cancelBtn: document.getElementById("delete-modal-cancel"),
      confirmBtn: document.getElementById("delete-modal-confirm"),
      triggerBtn: document.getElementById("delete-database-btn"),
    };
  }

  function openDeleteModal() {
    const { overlay, input, confirmBtn } = getModalEls();
    if (!overlay) return;

    overlay.hidden = false;
    input.value = "";
    confirmBtn.disabled = true;

    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      input.focus();
    });

    document.addEventListener("keydown", handleModalKeydown);
  }

  function closeDeleteModal() {
    const { overlay } = getModalEls();
    if (!overlay) return;

    overlay.classList.remove("is-visible");
    document.removeEventListener("keydown", handleModalKeydown);

    setTimeout(() => {
      overlay.hidden = true;
    }, 260);

    const { triggerBtn } = getModalEls();
    if (triggerBtn) triggerBtn.focus();
  }

  function handleModalKeydown(event) {
    if (event.key === "Escape") {
      closeDeleteModal();
    }
  }

  async function confirmDeleteDatabase() {
    const { overlay, confirmBtn } = getModalEls();
    if (!confirmBtn) return;

    const originalLabel = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Apagando...";

    try {
      const response = await fetch("/database", {
        method: "DELETE",
      });

      if (!response.ok) {
        console.warn(`[AI Usage Dashboard] DELETE /database retornou ${response.status}`);
        window.alert("Não foi possível apagar o banco de dados. Tente novamente.");
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalLabel;
        return;
      }

      closeDeleteModal();
      window.location.reload();
    } catch (err) {
      console.error("[AI Usage Dashboard]", err);
      window.alert("Erro ao apagar o banco de dados. Verifique sua conexão.");
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalLabel;
    }
  }

  function initDeleteDatabaseButton() {
    const { overlay, input, cancelBtn, confirmBtn, triggerBtn } = getModalEls();
    if (!triggerBtn || !overlay) return;

    triggerBtn.addEventListener("click", openDeleteModal);
    cancelBtn.addEventListener("click", closeDeleteModal);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeDeleteModal();
    });

    input.addEventListener("input", () => {
      confirmBtn.disabled = input.value.trim() !== "DELETE";
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !confirmBtn.disabled) {
        confirmDeleteDatabase();
      }
    });

    confirmBtn.addEventListener("click", confirmDeleteDatabase);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getChatEls() {
    return {
      messages: document.getElementById("chat-messages"),
      emptyState: document.getElementById("chat-empty-state"),
      form: document.getElementById("chat-form"),
      input: document.getElementById("chat-input"),
      sendBtn: document.getElementById("chat-send-btn"),
      clearBtn: document.getElementById("chat-clear-btn"),
    };
  }

  const chatHistory = [];
  let chatIsWaiting = false;

  function formatChatTime() {
    return new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function scrollChatToBottom(messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendChatMessage(role, content, options = {}) {
    const { messages, emptyState } = getChatEls();
    if (!messages) return null;

    if (emptyState && emptyState.parentElement) {
      emptyState.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = `chat-message chat-message--${role}`;

    const avatar = document.createElement("div");
    avatar.className = "chat-message__avatar";
    avatar.textContent = role === "user" ? "Você".slice(0, 1) : "IA";

    const body = document.createElement("div");
    body.className = "chat-message__body";

    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";
    if (options.isError) bubble.classList.add("chat-message__bubble--error");
    bubble.textContent = content;

    const time = document.createElement("span");
    time.className = "chat-message__time";
    time.textContent = formatChatTime();

    body.appendChild(bubble);
    body.appendChild(time);
    wrapper.appendChild(avatar);
    wrapper.appendChild(body);
    messages.appendChild(wrapper);

    scrollChatToBottom(messages);

    return bubble;
  }

  function showChatTyping() {
    const { messages, emptyState } = getChatEls();
    if (!messages) return null;
    if (emptyState && emptyState.parentElement) emptyState.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "chat-message chat-message--assistant";
    wrapper.id = "chat-typing-indicator";

    const avatar = document.createElement("div");
    avatar.className = "chat-message__avatar";
    avatar.textContent = "IA";

    const body = document.createElement("div");
    body.className = "chat-message__body";

    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";
    bubble.innerHTML = '<span class="chat-typing"><span></span><span></span><span></span></span>';

    body.appendChild(bubble);
    wrapper.appendChild(avatar);
    wrapper.appendChild(body);
    messages.appendChild(wrapper);

    scrollChatToBottom(messages);
    return wrapper;
  }

  function removeChatTyping() {
    const typing = document.getElementById("chat-typing-indicator");
    if (typing) typing.remove();
  }

  function setChatWaiting(isWaiting) {
    chatIsWaiting = isWaiting;
    const { input, sendBtn } = getChatEls();
    if (sendBtn) sendBtn.disabled = isWaiting || !input || !input.value.trim();
    if (input) input.disabled = isWaiting;
  }

  function autoResizeChatInput(input) {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }

  async function sendChatMessage(message) {
    appendChatMessage("user", message);
    chatHistory.push({ role: "user", content: message });

    setChatWaiting(true);
    showChatTyping();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: message,
          history: chatHistory.slice(0, -1),
        }),
      });

      removeChatTyping();

      if (!response.ok) {
        console.warn(`[AI Usage Dashboard] POST /api/chat retornou ${response.status}`);
        appendChatMessage(
          "assistant",
          "Não foi possível obter uma resposta agora. Tente novamente em instantes.",
          { isError: true }
        );
        return;
      }

      const result = await response.json();

      if (!result || typeof result.response !== "string") {
        appendChatMessage(
          "assistant",
          "A resposta recebida veio em um formato inesperado.",
          { isError: true }
        );
        return;
      }

      appendChatMessage("assistant", result.response);
      chatHistory.push({ role: "assistant", content: result.response });
    } catch (err) {
      console.error("[AI Usage Dashboard]", err);
      removeChatTyping();
      appendChatMessage(
        "assistant",
        "Erro de conexão ao falar com a IA. Verifique sua rede e tente novamente.",
        { isError: true }
      );
    } finally {
      setChatWaiting(false);
    }
  }

  function clearChatConversation() {
    const { messages, input } = getChatEls();
    if (!messages) return;

    chatHistory.length = 0;
    messages.innerHTML = "";

    const emptyState = document.createElement("div");
    emptyState.className = "chat-empty-state";
    emptyState.id = "chat-empty-state";
    emptyState.innerHTML = `
      <div class="chat-empty-state__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3097 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47087C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="chat-empty-state__title">Comece uma conversa</p>
      <p class="chat-empty-state__subtitle">Envie uma mensagem para conversar com a IA</p>
    `;
    messages.appendChild(emptyState);

    if (input) {
      input.value = "";
      autoResizeChatInput(input);
      input.focus();
    }

    setChatWaiting(false);
  }

  function initChat() {
    const { form, input, sendBtn, clearBtn } = getChatEls();
    if (!form || !input || !sendBtn) return;

    input.addEventListener("input", () => {
      autoResizeChatInput(input);
      sendBtn.disabled = chatIsWaiting || !input.value.trim();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!sendBtn.disabled) form.requestSubmit();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message || chatIsWaiting) return;

      input.value = "";
      autoResizeChatInput(input);
      sendBtn.disabled = true;

      sendChatMessage(message);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", clearChatConversation);
    }
  }

  function init() {
    revealPage();
    initDeleteDatabaseButton();
    initChat();

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
