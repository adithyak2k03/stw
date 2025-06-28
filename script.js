const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spin");
const optionsBody = document.getElementById("options-body");
const addOptionBtn = document.getElementById("add-option");
const resultHeading = document.getElementById("result");
const pointer = document.getElementById("pointer");

let options = JSON.parse(localStorage.getItem("options")) || [
  { label: "Write Something", weight: 1 },
];
let angle = 0;
let spinning = false;

function getTotalWeight() {
  return options.reduce((acc, o) => acc + o.weight, 0);
}

function getColor(index) {
  return `hsl(${(index * 360) / options.length}, 80%, 60%)`;
}

function drawWheel() {
  const totalWeight = getTotalWeight();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(angle);

  let startAngle = 0;

  options.forEach((opt, i) => {
    const sliceAngle = (2 * Math.PI * opt.weight) / totalWeight;
    const endAngle = startAngle + sliceAngle;
    const percentage = ((opt.weight / totalWeight) * 100).toFixed(1);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, canvas.width / 2, startAngle, endAngle);
    ctx.fillStyle = getColor(i);
    ctx.fill();

    ctx.save();
    const midAngle = startAngle + sliceAngle / 2;
    ctx.rotate(midAngle);

    // Pull inward so text stays inside wheel
    ctx.translate(canvas.width / 2 - 40, 0);

    // Flip text if upside down
    const textAngle = (angle + midAngle) % (2 * Math.PI);
    if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
      ctx.rotate(Math.PI);
    }

    // Dynamically adjust font size based on number of options
    const baseFontSize = 14;
    const minFontSize = 10;
    const maxFontSize = 16;
    const adjustedFontSize = Math.max(
      minFontSize,
      Math.min(maxFontSize, baseFontSize * (10 / options.length))
    );

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `${adjustedFontSize}px Arial`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.strokeText(opt.label, 0, 0);
    ctx.fillText(opt.label, 0, 0);
    ctx.restore();

    startAngle = endAngle;
  });

  ctx.restore();
}

const tooltip = document.getElementById("tooltip");

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - canvas.width / 2;
  const y = e.clientY - rect.top - canvas.height / 2;
  const distance = Math.sqrt(x * x + y * y);

  if (distance > canvas.width / 2) {
    tooltip.style.display = "none";
    return;
  }

  const totalWeight = getTotalWeight();
  const mouseAngle = (Math.atan2(y, x) - angle + 2 * Math.PI) % (2 * Math.PI);
  let startAngle = 0;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const sliceAngle = (2 * Math.PI * opt.weight) / totalWeight;
    const endAngle = startAngle + sliceAngle;

    if (mouseAngle >= startAngle && mouseAngle < endAngle) {
      tooltip.style.display = "block";
      tooltip.style.left = e.pageX + 10 + "px";
      tooltip.style.top = e.pageY + 10 + "px";
      const percentage = ((opt.weight / totalWeight) * 100).toFixed(1);
      tooltip.textContent = `${opt.label} (${percentage}%)`;
      return;
    }

    startAngle = endAngle;
  }

  tooltip.style.display = "none";
});

canvas.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

function spinWheel() {
  if (spinning) return;
  spinning = true;
  pointer.classList.add("spin");

  const fullSpins = 5;
  const duration = 4000;
  const target = Math.random() * 2 * Math.PI;
  const totalRotation = 2 * Math.PI * fullSpins + target;
  const start = performance.now();

  function animate(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    angle = totalRotation * eased;
    drawWheel();
    if (progress < 1) requestAnimationFrame(animate);
    else {
      spinning = false;
      pointer.classList.remove("spin");
      showResult();
    }
  }
  requestAnimationFrame(animate);
}

function showResult() {
  const totalWeight = getTotalWeight();
  // let currentAngle = (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI);
  let currentAngle = ((Math.PI * 3) / 2 - angle) % (2 * Math.PI);
  if (currentAngle < 0) currentAngle += 2 * Math.PI;

  let startAngle = 0;

  for (let i = 0; i < options.length; i++) {
    const sliceAngle = (2 * Math.PI * options[i].weight) / totalWeight;
    const endAngle = startAngle + sliceAngle;
    if (currentAngle >= startAngle && currentAngle < endAngle) {
      const selected = options[i].label;
      resultHeading.textContent = `🎉 Selected: ${selected} 🎉`;
      resultHeading.classList.add("show");
      throwConfetti();
      break;
    }
    startAngle = endAngle;
  }
}

function throwConfetti() {
  if (typeof confetti !== "undefined") {
    confetti({
      particleCount: 500,
      spread: 1000,
      origin: { y: 0.4 },
    });
  }
}

function saveOptions() {
  localStorage.setItem("options", JSON.stringify(options));
}

function updateTable() {
  const totalWeight = getTotalWeight();
  optionsBody.innerHTML = "";
  options.forEach((opt, index) => {
    const row = document.createElement("tr");

    const snoCell = document.createElement("td");
    snoCell.textContent = index + 1;

    const colorCell = document.createElement("td");
    const colorBox = document.createElement("div");
    colorBox.style.backgroundColor = getColor(index);
    colorBox.style.width = "20px";
    colorBox.style.height = "20px";
    colorBox.style.borderRadius = "4px";
    colorBox.style.border = "1px solid #ccc";
    colorCell.appendChild(colorBox);

    const labelCell = document.createElement("td");
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = opt.label;
    labelInput.addEventListener("input", (e) => {
      options[index].label = e.target.value;
      saveOptions();
      drawWheel();
    });
    labelCell.appendChild(labelInput);

    const weightCell = document.createElement("td");
    const percentage = ((opt.weight / totalWeight) * 100).toFixed(1);
    weightCell.textContent = `${opt.weight} (${percentage}%)`;

    const actionsCell = document.createElement("td");
    const addBtn = document.createElement("span");
    addBtn.innerHTML = "<span title='Increase Weight'>➕</span>";
    addBtn.className = "action-btn";
    addBtn.onclick = () => {
      options[index].weight++;
      saveOptions();
      updateTable();
      drawWheel();
    };

    const reduceBtn = document.createElement("span");
    reduceBtn.innerHTML = "<span title='Decrease Weight'>➖</span>";
    reduceBtn.className = "action-btn";
    reduceBtn.onclick = () => {
      if (options[index].weight > 1) {
        options[index].weight--;
        saveOptions();
        updateTable();
        drawWheel();
      }
    };

    const delBtn = document.createElement("span");
    delBtn.innerHTML = "<span title='Delete Option'>🗑️</span>";
    delBtn.className = "action-btn";
    delBtn.onclick = () => {
      options.splice(index, 1);
      saveOptions();
      updateTable();
      drawWheel();
    };

    actionsCell.append(addBtn, reduceBtn, delBtn);

    row.append(snoCell, colorCell, labelCell, weightCell, actionsCell);
    optionsBody.appendChild(row);
  });
}

addOptionBtn.addEventListener("click", () => {
  const count = options.length + 1;
  options.push({ label: `New Option #${count}`, weight: 1 });
  saveOptions();
  updateTable();
  drawWheel();
});

spinButton.addEventListener("click", spinWheel);

updateTable();
drawWheel();
