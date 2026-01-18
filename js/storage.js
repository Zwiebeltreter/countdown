const STORAGE_KEY = "countdowns";

function defaultCountdowns() {
  return Array.from({ length: 5 }, (_, i) => ({
    title: "",
    targetDate: "",
    image: null,
    active: false
  }));
}

function loadCountdowns() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultCountdowns();
}

function saveCountdowns(countdowns) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns));
}

function clearCountdown(index) {
  const countdowns = loadCountdowns();
  countdowns[index] = {
    title: "",
    targetDate: "",
    image: null,
    active: false
  };
  saveCountdowns(countdowns);
}
