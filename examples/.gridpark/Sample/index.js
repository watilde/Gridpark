const SHEET_NAME = "Employees";
const SHEET_SELECTOR = `sheet[name="${SHEET_NAME}"]`;
const HEADER_SELECTOR = `${SHEET_SELECTOR} row[index="1"] cell`;
const VALUE_COLUMN_INDEX = 2;

const toArray = (nodes) => Array.from(nodes ?? []);

const getColumnLabelFromRef = (ref = "") =>
  ref.replace(/[0-9]/g, "") || "A";

const getSheet = () =>
  gridpark.querySelector(SHEET_SELECTOR) ||
  gridpark.querySelector(`sheet#${SHEET_NAME}`);

const sortByColumn = (columnLabel) => {
  const sheet = getSheet();
  if (!sheet) return;
  const rows = toArray(sheet.querySelectorAll("row")).filter(
    (row) => Number(row.index) > 1,
  );
  rows.sort((a, b) => {
    const aCell = a.querySelector(`cell[ref^='${columnLabel}']`);
    const bCell = b.querySelector(`cell[ref^='${columnLabel}']`);
    return (Number(aCell?.value) || 0) - (Number(bCell?.value) || 0);
  });
  rows.forEach((row, idx) => {
    row.index = idx + 2;
    sheet.appendChild(row);
  });
};

gridpark.on("click", HEADER_SELECTOR, (event) => {
  const headerCell = event.target;
  const colLabel = getColumnLabelFromRef(headerCell.ref);
  sortByColumn(colLabel);
  headerCell.classList.add("sorted");
  setTimeout(() => headerCell.classList.remove("sorted"), 800);
});

gridpark.on("select", `${SHEET_SELECTOR} cell`, (event) => {
  const row = event.target.closest("row");
  toArray(gridpark.querySelectorAll(`${SHEET_SELECTOR} row.active`)).forEach(
    (activeRow) => activeRow.classList.remove("active"),
  );
  row?.classList.add("active");
});

const totalCell = () =>
  gridpark.querySelector(`${SHEET_SELECTOR} cell[name="Total"]`);

const recalcTotals = () => {
  const values = toArray(
    gridpark.querySelectorAll(`${SHEET_SELECTOR} col[index="${VALUE_COLUMN_INDEX}"] cell`),
  );
  const sum = values.reduce(
    (acc, cell) => acc + Number(cell?.value || 0),
    0,
  );
  const target = totalCell();
  if (target) target.value = sum;
};

gridpark.on(
  "change",
  `${SHEET_SELECTOR} col[index="${VALUE_COLUMN_INDEX}"] cell`,
  recalcTotals,
);
recalcTotals();

gridpark.watch(`${SHEET_SELECTOR} cell`, (cell) => {
  const value = Number(cell.value);
  cell.classList.toggle("over-limit", Number.isFinite(value) && value > 100);
});

const tooltipForCell = (ref, text) => {
  gridpark.on("hover", `${SHEET_SELECTOR} cell[ref="${ref}"]`, (event) => {
    const tooltip = document.createElement("div");
    tooltip.textContent = text;
    tooltip.className = "gridpark-tooltip";
    document.body.appendChild(tooltip);
    const updatePosition = (mouseEvent) => {
      tooltip.style.left = `${mouseEvent.clientX + 12}px`;
      tooltip.style.top = `${mouseEvent.clientY + 12}px`;
    };
    updatePosition(event);
    const cleanup = () => {
      event.target.removeEventListener("mousemove", updatePosition);
      tooltip.remove();
    };
    event.target.addEventListener("mousemove", updatePosition);
    event.target.addEventListener("mouseleave", cleanup, { once: true });
  });
};

tooltipForCell("A1", "This is cell A1");
