document
  .getElementById("calculate")
  .addEventListener("click", calculate);


async function calculate() {

  const duration =
    Number(
      document.getElementById(
        "workDuration"
      ).value
    );


  showLoading();


  try {

    const tabs =
      await browser.tabs.query({
        active: true,
        currentWindow: true
      });


    if (!tabs.length) {

      throw new Error(
        "Could not find the current tab."
      );
    }


    const tab =
      tabs[0];


    const response =
      await browser.tabs.sendMessage(
        tab.id,
        {
          action: "getPunchLogs"
        }
      );


    if (!response) {

      throw new Error(
        "No response from attendance page."
      );
    }


    if (response.error) {

      throw new Error(
        response.error
      );
    }


    const result =
      calculateAttendance(
        response.logs,
        duration
      );


    displayResult(result);


  } catch (error) {

    showError(
      error.message
    );

  }

}


function calculateAttendance(
  logs,
  requiredHours
) {

  if (!logs || logs.length === 0) {

    throw new Error(
      "No punch logs found."
    );
  }


  const requiredSeconds =
    requiredHours * 60 * 60;


  let totalWorkedSeconds = 0;

  let currentPunchIn = null;


  /*
   * Logs are oldest → newest.
   */

  for (const log of logs) {

    if (log.type === "in") {

      currentPunchIn =
        log.time;

    }


    else if (
      log.type === "out" &&
      currentPunchIn !== null
    ) {

      const seconds =
        (
          log.time -
          currentPunchIn
        ) / 1000;


      if (seconds > 0) {

        totalWorkedSeconds +=
          seconds;

      }


      currentPunchIn = null;
    }

  }


  /*
   * Determine current status.
   */

  const currentlyWorking =
    currentPunchIn !== null;


  /*
   * If currently punched IN,
   * add the current working session.
   */

  if (currentlyWorking) {

    const now =
      new Date();


    const currentSession =
      (
        now -
        currentPunchIn
      ) / 1000;


    if (currentSession > 0) {

      totalWorkedSeconds +=
        currentSession;

    }

  }


  /*
   * Calculate remaining work.
   */

  let remainingSeconds =
    requiredSeconds -
    totalWorkedSeconds;


  if (remainingSeconds < 0) {

    remainingSeconds = 0;

  }


  /*
   * Calculate expected logout.
   *
   * Only calculate it when currently
   * punched IN.
   */

  let logoutDate = null;


  if (currentlyWorking) {

    logoutDate =
      new Date(
        Date.now() +
        remainingSeconds * 1000
      );

  }


  return {

    totalWorkedSeconds,

    remainingSeconds,

    currentlyWorking,

    logoutDate

  };

}


function displayResult(result) {

  hideLoading();


  document
    .getElementById("error")
    .classList.add("hidden");


  document
    .getElementById("result")
    .classList.remove("hidden");


  const status =
    document.getElementById(
      "status"
    );


  if (result.currentlyWorking) {

    status.textContent =
      "● Currently Punched In";

    status.style.background =
      "#dcfce7";

    status.style.color =
      "#166534";

  } else {

    status.textContent =
      "● Currently Punched Out";

    status.style.background =
      "#fee2e2";

    status.style.color =
      "#991b1b";

  }


  document
    .getElementById(
      "workedTime"
    )
    .textContent =
      formatDuration(
        result.totalWorkedSeconds
      );


  document
    .getElementById(
      "remainingTime"
    )
    .textContent =
      formatDuration(
        result.remainingSeconds
      );


  const logout =
    document.getElementById(
      "logoutTime"
    );


  if (
    result.currentlyWorking &&
    result.logoutDate
  ) {

    logout.textContent =
      formatTime(
        result.logoutDate
      );

  } else {

    logout.textContent =
      "Punch In First";

  }

}


function formatDuration(
  totalSeconds
) {

  totalSeconds =
    Math.max(
      0,
      Math.floor(totalSeconds)
    );


  const hours =
    Math.floor(
      totalSeconds / 3600
    );


  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );


  const seconds =
    totalSeconds % 60;


  return (
    String(hours).padStart(2, "0") +
    "h " +
    String(minutes).padStart(2, "0") +
    "m " +
    String(seconds).padStart(2, "0") +
    "s"
  );

}


function formatTime(date) {

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );

}


function showLoading() {

  document
    .getElementById(
      "loading"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "result"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "error"
    )
    .classList.add(
      "hidden"
    );

}


function hideLoading() {

  document
    .getElementById(
      "loading"
    )
    .classList.add(
      "hidden"
    );

}


function showError(message) {

  hideLoading();


  document
    .getElementById(
      "result"
    )
    .classList.add(
      "hidden"
    );


  const error =
    document.getElementById(
      "error"
    );


  error.textContent =
    message;


  error.classList.remove(
    "hidden"
  );

}
