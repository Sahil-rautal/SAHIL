const seedFeedback = [
  {
    id: "FB-1001",
    patient: "Aarav Kulkarni",
    department: "Emergency",
    rating: 3,
    message: "Waiting time was longer than expected, but doctor support was good.",
    date: "2026-02-17",
    status: "In Review",
  },
  {
    id: "FB-1002",
    patient: "Meera Shah",
    department: "Cardiology",
    rating: 5,
    message: "Excellent care and very clear communication from staff.",
    date: "2026-02-18",
    status: "Resolved",
  },
  {
    id: "FB-1003",
    patient: "Rohan Iyer",
    department: "Neurology",
    rating: 2,
    message: "Billing process was confusing and took too much time.",
    date: "2026-02-19",
    status: "New",
  },
  {
    id: "FB-1004",
    patient: "Anaya Desai",
    department: "Pediatrics",
    rating: 4,
    message: "Doctor was kind and patient. Child-friendly environment appreciated.",
    date: "2026-02-20",
    status: "New",
  },
  {
    id: "FB-1005",
    patient: "Kabir Patil",
    department: "Emergency",
    rating: 1,
    message: "Very dissatisfied with the delay in receiving initial assessment.",
    date: "2026-02-20",
    status: "In Review",
  },
];

const statusFlow = ["New", "In Review", "Resolved"];
const feedbackBody = document.getElementById("feedback-body");
const statsGrid = document.getElementById("stats-grid");
const statusChart = document.getElementById("status-chart");
const departmentChart = document.getElementById("department-chart");

const filters = {
  department: document.getElementById("department-filter"),
  status: document.getElementById("status-filter"),
  search: document.getElementById("search-input"),
};

const feedbackItems = JSON.parse(localStorage.getItem("shrc-feedback") || "null") || seedFeedback;

function saveItems() {
  localStorage.setItem("shrc-feedback", JSON.stringify(feedbackItems));
}

function statusClass(status) {
  if (status === "Resolved") return "status-resolved";
  if (status === "In Review") return "status-review";
  return "status-new";
}

function renderStats(items) {
  const avgRating = items.length
    ? (items.reduce((total, item) => total + item.rating, 0) / items.length).toFixed(1)
    : "0.0";

  const cards = [
    { label: "Total Feedback", value: items.length },
    { label: "New", value: items.filter((item) => item.status === "New").length },
    { label: "In Review", value: items.filter((item) => item.status === "In Review").length },
    { label: "Resolved", value: items.filter((item) => item.status === "Resolved").length },
    { label: "Avg. Rating", value: `${avgRating} / 5` },
  ];

  statsGrid.innerHTML = cards
    .map(
      (card) => `
      <article class="stat-card">
        <h3>${card.label}</h3>
        <p>${card.value}</p>
      </article>
    `,
    )
    .join("");
}

function renderBars(container, rows, maxValue, formatter) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty-state">No feedback data for selected filters.</div>';
    return;
  }

  const safeMax = maxValue || 1;
  container.innerHTML = rows
    .map((row) => {
      const width = Math.max(4, (row.value / safeMax) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${row.label}</span>
          <div class="bar-track" role="img" aria-label="${row.label}: ${formatter(row.value)}">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
          <span class="bar-value">${formatter(row.value)}</span>
        </div>
      `;
    })
    .join("");
}

function renderCharts(items) {
  const statusRows = statusFlow.map((status) => ({
    label: status,
    value: items.filter((item) => item.status === status).length,
  }));

  const byDepartment = new Map();
  items.forEach((item) => {
    const current = byDepartment.get(item.department) || { ratingTotal: 0, count: 0 };
    current.ratingTotal += item.rating;
    current.count += 1;
    byDepartment.set(item.department, current);
  });

  const departmentRows = [...byDepartment.entries()]
    .map(([department, values]) => ({
      label: department,
      value: Number((values.ratingTotal / values.count).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);

  renderBars(
    statusChart,
    statusRows,
    Math.max(...statusRows.map((row) => row.value), 1),
    (value) => `${value}`,
  );

  renderBars(
    departmentChart,
    departmentRows,
    5,
    (value) => `${Number(value).toFixed(1)}`,
  );
}

function filteredItems() {
  return feedbackItems.filter((item) => {
    const departmentMatch = filters.department.value === "all" || item.department === filters.department.value;
    const statusMatch = filters.status.value === "all" || item.status === filters.status.value;
    const query = filters.search.value.trim().toLowerCase();
    const textMatch =
      !query ||
      item.patient.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query);

    return departmentMatch && statusMatch && textMatch;
  });
}

function renderTable() {
  const items = filteredItems();
  renderStats(items);
  renderCharts(items);

  if (!items.length) {
    feedbackBody.innerHTML = '<tr><td colspan="8" class="empty-state">No feedback records found.</td></tr>';
    return;
  }

  feedbackBody.innerHTML = items
    .map(
      (item, index) => `
      <tr>
        <td>${item.id}</td>
        <td>${item.patient}</td>
        <td>${item.department}</td>
        <td>${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</td>
        <td>${item.message}</td>
        <td>${item.date}</td>
        <td><span class="status-badge ${statusClass(item.status)}">${item.status}</span></td>
        <td><button class="action-btn" data-index="${index}">Move Next</button></td>
      </tr>
    `,
    )
    .join("");
}

function exportCsv() {
  const headers = ["ID", "Patient", "Department", "Rating", "Message", "Date", "Status"];
  const rows = feedbackItems.map((item) => [
    item.id,
    item.patient,
    item.department,
    item.rating,
    `"${item.message.replaceAll('"', '""')}"`,
    item.date,
    item.status,
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "shrc-feedback-report.csv");
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

Object.values(filters).forEach((control) => {
  control.addEventListener("input", renderTable);
  control.addEventListener("change", renderTable);
});

feedbackBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const visibleItems = filteredItems();
  const item = visibleItems[index];
  if (!item) return;

  const target = feedbackItems.find((feedback) => feedback.id === item.id);
  const currentPosition = statusFlow.indexOf(target.status);
  target.status = statusFlow[(currentPosition + 1) % statusFlow.length];

  saveItems();
  renderTable();
});

document.getElementById("export-btn").addEventListener("click", exportCsv);

renderTable();
