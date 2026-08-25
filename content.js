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

      return {
        error: error.message
      };

    }
  }
);


function readPunchLogs() {

  const items = document.querySelectorAll(
    ".ah-log-timeline-list-item"
  );

  if (!items.length) {

    throw new Error(
      "No punch logs found. Make sure the attendance page is open."
    );
  }

  const logs = [];

  items.forEach((item) => {

    /*
     * Get the time.
     *
     * Example:
     * 12:57:11 PM
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
      typeElement.textContent.trim().toLowerCase();

    let type;

    if (typeText === "punch in") {

      type = "in";

    } else if (typeText === "punch out") {

      type = "out";

    } else {

      return;
    }

    const time =
      parseTime(timeText);

    /*
     * Get break if available.
     */

    const breakElement =
      item.querySelector(
        ".ah-att-break-time"
      );

    let breakSeconds = 0;

    if (breakElement) {

      breakSeconds =
        parseBreakTime(
          breakElement.textContent.trim()
        );
    }

    logs.push({

      type: type,

      time: time,

      displayTime: timeText,

      breakSeconds: breakSeconds

    });

  });


  if (!logs.length) {

    throw new Error(
      "Punch entries were found, but no valid Punch In/Out times were detected."
    );
  }


  /*
   * The website displays newest first.
   *
   * We reverse/sort them so that calculations
   * happen oldest → newest.
   */

  logs.sort(
    (a, b) => a.time - b.time
  );


  console.log(
    "Attendance Calculator - detected logs:",
    logs
  );


  return logs;
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


  if (period === "PM" && hour !== 12) {

    hour += 12;

  }


  if (period === "AM" && hour === 12) {

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


function parseBreakTime(text) {

  /*
   * Example:
   *
   * 00h 11m 44s Break
   */

  const match =
    text.match(
      /(\d+)h\s*(\d+)m\s*(\d+)s/i
    );

  if (!match) {
    return 0;
  }


  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  const seconds =
    Number(match[3]);


  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}
