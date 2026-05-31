
(function () {

  /** Waits for Firebase to be ready, then subscribes to the tasks node and updates KPIs live. */
  async function init() {
    if (!window.firebaseDb || !window.ref || !window.onValue) {
      setTimeout(init, 100);
      return;
    }

    if (typeof seedTasksIfEmpty === "function") {
      await seedTasksIfEmpty();
    }

    const tasksRef = window.ref(window.firebaseDb, "tasks");
    window.onValue(tasksRef, (snapshot) => {
      const val = snapshot.val() || {};
      const tasks = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
      updateKPIs(tasks);
    });
  }

  /**
   * Counts tasks whose status matches any of the given status values.
   * @param {object[]} tasks
   * @param {...string} statusValues
   * @returns {number}
   */
  function countByStatus(tasks, ...statusValues) {
    return tasks.filter((t) => statusValues.some((s) => t.status === s)).length;
  }

  /**
   * Returns tasks whose priority matches the given value (case-insensitive).
   * @param {object[]} tasks
   * @param {string} priority
   * @returns {object[]}
   */
  function filterByPriority(tasks, priority) {
    const lowerPriority = priority.toLowerCase();
    return tasks.filter(
      (t) => t.priority && t.priority.toLowerCase() === lowerPriority
    );
  }

  /**
   * Writes each count value into the corresponding KPI DOM element.
   * @param {{ todo: number, done: number, urgent: number, progress: number, feedback: number, total: number, email: number }} counts
   */
  function updateAllKPIElements(counts) {
    updateElement("kpi-todo", counts.todo);
    updateElement("kpi-done", counts.done);
    updateElement("kpi-urgent", counts.urgent);
    updateElement("kpi-progress", counts.progress);
    updateElement("kpi-feedback", counts.feedback);
    updateElement("kpi-board", counts.total);
    updateElement("kpi-email", counts.email);
  }

  /**
   * Calculates all KPI counts and updates the dashboard elements and urgent deadline.
   * @param {object[]} tasks
   */
  function updateKPIs(tasks) {
    const counts = {
      todo: countByStatus(tasks, "todo", "To do"),
      done: countByStatus(tasks, "done", "Done"),
      progress: countByStatus(tasks, "inprogress", "inProgress", "in-progress"),
      feedback: countByStatus(
        tasks,
        "await_feedback",
        "awaitFeedback",
        "await-feedback"
      ),
      urgent: filterByPriority(tasks, "urgent").length,
      total: tasks.length,
      email: tasks.filter((t) => t.creator && t.creator.type === "external").length,
    };

    updateAllKPIElements(counts);
    updateUrgentDeadline(filterByPriority(tasks, "urgent"));
  }

  /**
   * Sets the text content of a DOM element by id.
   * @param {string} id
   * @param {string|number} value
   */
  function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /**
   * Returns the task with the earliest due date from a list.
   * @param {object[]} tasks
   * @returns {object}
   */
  function findEarliestTask(tasks) {
    return tasks.reduce((earliest, current) => {
      const currentDate = new Date(current.dueDate);
      const earliestDate = new Date(earliest.dueDate);
      return currentDate < earliestDate ? current : earliest;
    });
  }

  /**
   * Formats a date string as a localised long-form date (e.g. "January 15, 2026").
   * @param {string} dateStr - ISO date string.
   * @returns {string}
   */
  function formatDeadlineDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Updates the `.deadlinedate` element with the earliest urgent task's due date.
   * @param {object[]} urgentTasks
   */
  function updateUrgentDeadline(urgentTasks) {
    const deadlineEl = document.querySelector(".deadlinedate");
    if (!deadlineEl) return;

    if (urgentTasks.length === 0) {
      deadlineEl.textContent = "No urgent tasks";
      return;
    }

    const tasksWithDate = urgentTasks.filter((t) => t.dueDate);
    if (tasksWithDate.length === 0) {
      deadlineEl.textContent = "No deadline set";
      return;
    }

    const earliestTask = findEarliestTask(tasksWithDate);
    deadlineEl.textContent = formatDeadlineDate(earliestTask.dueDate);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
