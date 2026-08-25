browser.runtime.onMessage.addListener(
  async (request) => {

    if (request.action !== "getPunchLogs") {
      return;
    }

    try {

      const logs = readPunchLogs();

      return {
        logs: logs
      };

    } catch (error) {

      console.error(
        "Attendance Calculator:",
        error
      );

      return {
        error: error.message
      };
    }
  }
);


function readPunchLogs() {

  /*
   * IMPORTANT:
   *
   * Instead of searching the entire page for
   * every .ah-log-timeline-list-item,
   * first find the actual punch-log <ul>.
   *
   * This prevents duplicate Angular-rendered
   * elements from being counted.
   */

  const lists = document.querySelectorAll(
    "ul.ah-log-timeline-list"
  );


  if (!lists.length) {

    throw new Error(
      "Punch log list was not found."
    );
  }


  /*
   * Use the first actual punch-log list.
   */

  const list = lists[0];


  const items = list.querySelectorAll(
    ":scope > li.ah-log-timeline-list-item"
  );


  if (!items.length) {

    throw new Error(
      "No punch entries were found."
    );
  }


  const logs = [];


  items.forEach((item) => {

    /*
     * Get punch time.
     */

    const timeElement =
      item.querySelector(
        ".ah-log-timeline-list-item-start .ah-text"
      );


    /*
     * Get Punch In / Punch Out.
     */

    const typeElement =
      item.querySelector(
        ".ah-text-data"
      );


    if (!timeElement || !typeElement) {
      return;
    }


    const timeText =
      timeElement.textContent.trim();


    const typeText =
      typeElement.textContent
        .trim()
        .toLowerCase();


    let type = null;


    if (typeText === "punch in") {

      type = "in";

    } else if (typeText === "punch out") {

      type = "out";

    } else {

      return;
    }


    logs.push({

      type: type,

      time: parseTime(timeText),

      displayTime: timeText

    });

  });


  if (!logs.length) {

    throw new Error(
      "No valid Punch In/Punch Out records found."
    );
  }


  /*
   * The website shows newest first.
   *
   * Sort:
   *
   * oldest → newest
   */

  logs.sort(
    (a, b) => a.time - b.time
  );


  /*
   * Remove accidental duplicate punches.
   *
   * For example, if Angular happens to expose:
   *
   * 09:10 IN
   * 09:10 IN
   *
   * only keep one.
   */

  const uniqueLogs = [];


  for (const log of logs) {

    const previous =
      uniqueLogs[
        uniqueLogs.length - 1
      ];


    if (
      previous &&
      previous.type === log.type &&
      previous.time.getTime() ===
        log.time.getTime()
    ) {

      continue;
    }


    uniqueLogs.push(log);
  }


  console.log(
    "Attendance Calculator - detected logs:",
    uniqueLogs
  );


  return uniqueLogs;
}


function parseTime(timeString) {

  const match =
    timeString.match(
      /^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i
    );


  if (!match) {

    throw new Error(
      "Could not understand time: " +
      timeString
    );
  }


  let hour =
    Number(match[1]);


  const minute =
    Number(match[2]);


  const second =
    Number(match[3]);


  const period =
    match[4].toUpperCase();


  /*
   * Convert 12-hour time to 24-hour time.
   */

  if (
    period === "PM" &&
    hour !== 12
  ) {

    hour += 12;
  }


  if (
    period === "AM" &&
    hour === 12
  ) {

    hour = 0;
  }


  const date =
    new Date();


  date.setHours(
    hour,
    minute,
    second,
    0
  );


  return date;
}
