const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.scheduledFunction = functions.pubsub
  .schedule("* 9-17 * * *")
  .timeZone("Asia/Yangon")
  .onRun(async (context) => {
    const dateTimeZone = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Yangon",
    });
    const date = new Date(dateTimeZone);
    const longMonth = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formatData = (input) => {
      if (input > 9) {
        return input;
      } else return `0${input}`;
    };

    let dd = formatData(date.getDate());
    let mm = longMonth[date.getMonth()];
    let yyyy = date.getFullYear();
    const getRandom = () => {
      let randomNumber = parseInt(Math.floor(Math.random() * 90 + 10));
      let digit = "";
      if (randomNumber.toString().length === 1) {
        digit = "0" + randomNumber;
      } else {
        digit = randomNumber + "";
      }
      return digit;
    };

    let currentTime =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

    //Start the random at 9 AM
    if (currentTime >= 9 * 3600 && currentTime <= 9 * 3600 + 30) {
      const liveLuckyNumberRef = db.collection("liveNumber").doc("2d");
      await db
        .collection("sections")
        .where("section", "==", "09:30 AM")
        .get()
        .then((snap) => {
          if (snap.docs[0].data().is_closed) {
            liveLuckyNumberRef.update({
              is_finished: true,
              // time: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            liveLuckyNumberRef.update({
              is_finished: false,
              // time: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
    }

    if (currentTime >= 9 * 3600 && currentTime <= 16 * 3600 + 31 * 60) {
      //generate random between 9 AM and 9:1 PM
      await db
        .collection("randomNumber")
        .doc("2d")
        .update({
          digit: getRandom(),
          time: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          const liveLuckyNumberRef = db.collection("liveNumber").doc("2d");
          liveLuckyNumberRef.get().then((snapShot) => {
            if (!snapShot.data().is_finished) {
              //  update random value if it is not finished
              liveLuckyNumberRef.update({
                time: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          });
        });
    }

    // 3D
    if (
      currentTime >= 14 * 3600 + 30 * 60 &&
      currentTime <= 14 * 3600 + 30 * 60 + 20
    ) {
      let todayDate = dd + "-" + mm + "-" + yyyy;
      await db
        .collection("threeDCalendar")
        .where("date", "==", todayDate)
        .onSnapshot((snapShot) => {
          if (snapShot.docs.length > 0) {
            db.collection("randomNumber")
              .doc("3d")
              .update({
                time: admin.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                const liveLuckyNumberRef = db
                  .collection("liveNumber")
                  .doc("3d");
                liveLuckyNumberRef.update({
                  is_finished: false,
                  time: admin.firestore.FieldValue.serverTimestamp(),
                });
              });
          }
        });
    }

    if (
      currentTime >= 14 * 3600 + 30 * 60 &&
      currentTime <= 15 * 3600 + 30 * 60 + 20
    ) {
      await db
        .collection("randomNumber")
        .doc("3d")
        .update({
          time: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          const liveLuckyNumberRef = db.collection("liveNumber").doc("3d");
          liveLuckyNumberRef.get().then((snapShot) => {
            if (!snapShot.data().is_finished) {
              //  update random value if it is not finished
              liveLuckyNumberRef.update({
                time: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          });
        });
    }
  });

exports.onRandomUpdate = functions.firestore
  .document("randomNumber/2d")
  .onUpdate(async (snap, context) => {
    // format date
    const dateTimeZone = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Yangon",
    });

    const date = new Date(dateTimeZone);
    const longMonth = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formatData = (input) => {
      if (input > 9) {
        return input;
      } else return `0${input}`;
    };

    let dd = formatData(date.getDate());
    let mm = longMonth[date.getMonth()];
    let yyyy = date.getFullYear();
    let todayDate = dd + "-" + mm + "-" + yyyy;
    let currentTime =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

    // end format date

    // manipulated docs id
    let nineDoc = "09:30 AM_" + todayDate;
    let twelveDoc = "12:00 PM_" + todayDate;
    let twoDoc = "02:30 PM_" + todayDate;
    let fourDoc = "04:30 PM_" + todayDate;
    console.log("nine doc", nineDoc);
    // end manipulated docs id

    // declare global for luckyNumber snapshot
    let luckySnap = "";
    const liveLuckyNumberRef = db.collection("liveNumber").doc("2d");
    await liveLuckyNumberRef.get().then((snapShot) => {
      luckySnap = snapShot.data();
    });
    // end declare global for luckyNumber snapshot

    // show lucky number
    async function showTwoDLuckyNumber(docName, section, upComingSection) {
      console.log(
        "Doc:",
        docName,
        "Section:",
        section,
        "Upcoming Section",
        upComingSection
      );
      await db
        .collection("sections")
        .where("section", "==", section)
        .get()
        .then(async (sectionSnap) => {
          if (sectionSnap.docs[0].data().is_closed == false) {
            console.log("not closed===", sectionSnap.docs[0].data().section);
            await db
              .collection("twoDLuckyNumbers")
              .doc(docName)
              .get()
              .then(async (twoDLuckyNumberSnap) => {
                let set_num = (
                  (Math.floor(Math.random() * 900000) +
                    7000000 +
                    Math.ceil(Math.random() * 99) *
                      (Math.round(Math.random()) ? 1 : -1)) /
                  100
                ).toFixed(2);
                let value_num = (
                  (Math.floor(Math.random() * 900000) +
                    1000000 +
                    Math.ceil(Math.random() * 99) *
                      (Math.round(Math.random()) ? 1 : -1)) /
                  100
                ).toFixed(2);
                let fixedSetNumber = "";
                if (twoDLuckyNumberSnap.exists) {
                  console.log(
                    "lucky number ++++=",
                    twoDLuckyNumberSnap.data().luckyNumber
                  );
                  console.log("lucky snapshot exist");
                  fixedSetNumber = twoDLuckyNumberSnap.data().luckyNumber + "";
                  let lucky_set_num =
                    set_num.split(".")[0] +
                    "." +
                    Math.floor(Math.random() * 9) +
                    fixedSetNumber.slice(0, 1);
                  let lucky_value_num =
                    value_num.split(".")[0] +
                    "." +
                    Math.floor(Math.random() * 9) +
                    fixedSetNumber.slice(1);

                  await db
                    .collection("twoDLuckyNumbers")
                    .doc(docName)
                    .update({
                      is_finished: true,
                      timeStamp: admin.firestore.FieldValue.serverTimestamp(),
                    })
                    .then(() => {
                      console.log("updated true to luckyNumbers");
                    });
                  await liveLuckyNumberRef
                    .update({
                      is_finished: true,
                      num1: lucky_set_num,
                      num2: lucky_value_num,
                      luckyNumber: fixedSetNumber + "",
                      time: admin.firestore.FieldValue.serverTimestamp(),
                      upComingSection: upComingSection,
                    })
                    .then(() => {
                      console.log("updated liveNumber doc");
                    });
                } else {
                  console.log("lucky number not found");
                  let randomLuckyNumber =
                    set_num.split(".")[1].slice(1) +
                    value_num.split(".")[1].slice(1);
                  console.log("random luck num===", randomLuckyNumber);
                  await liveLuckyNumberRef
                    .update({
                      is_finished: true,
                      luckyNumber: randomLuckyNumber + "",
                      num1: set_num + "",
                      num2: value_num + "",
                      time: admin.firestore.FieldValue.serverTimestamp(),
                      upComingSection: upComingSection,
                    })
                    .then(() => {
                      console.log("===lucky number updated===");
                    });
                  await db
                    .collection("twoDLuckyNumbers")
                    .doc(docName)
                    .set({
                      date: todayDate,
                      id: docName,
                      is_finished: true,
                      luckyNumber: randomLuckyNumber,
                      month: mm + "-" + yyyy,
                      session: section,
                      updatedDate: todayDate,
                      year: yyyy + "",
                      timeStamp: admin.firestore.FieldValue.serverTimestamp(),
                    })
                    .then(() => {
                      console.log("===new lucky number added===");
                    });
                }
              });
          }
        });
    }

    // stop random live lucky number
    async function stopRandom() {
      if (!luckySnap.is_finished) {
        await liveLuckyNumberRef.update({
          is_finished: true,
          time: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // restart random live lucky number
    async function restartRandom(section) {
      await db
        .collection("sections")
        .where("section", "==", section)
        .get()
        .then((snap) => {
          if (snap.docs[0].data().is_closed) {
            liveLuckyNumberRef.update({
              is_finished: true,
              time: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            liveLuckyNumberRef.update({
              is_finished: false,
              time: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
    }

    //generate random set, value and lucky number
    async function showRandomNumber() {
      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1].slice(1) + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    }

    if (
      currentTime >= 9 * 3600 + 30 * 60 &&
      currentTime < 9 * 3600 + 30 * 60 + 10
    ) {
      // 9:30 am
      await showTwoDLuckyNumber(nineDoc, "09:30 AM", "12:00 PM");
      await stopRandom();
    } else if (
      currentTime >= 11 * 3600 + 30 * 60 &&
      currentTime <= 11 * 3600 + 30 * 60 + 10
    ) {
      await restartRandom("12:00 PM");
    } else if (
      // 12 pm
      currentTime >= 12 * 3600 &&
      currentTime < 12 * 3600 + 10
    ) {
      await showTwoDLuckyNumber(twelveDoc, "12:00 PM", "02:30 PM");
      await stopRandom();
    } 
    // else if (
    //   // test luck num
    //   currentTime >= 17 * 3600 + 9 * 60 &&
    //   currentTime < 17 * 3600 + 9 * 60 + 10
    // ) {
    //   await showTwoDLuckyNumber(fourDoc, "04:30 PM", "09:30 AM");
    //   await stopRandom();
    // } 
    else if (currentTime >= 14 * 3600 && currentTime <= 14 * 3600 + 10) {
      // test restart
      await restartRandom("02:30 PM");
    } else if (
      // 2:30 pm
      currentTime >= 14 * 3600 + 30 * 60 &&
      currentTime < 14 * 3600 + 30 * 60 + 10
    ) {
      await showTwoDLuckyNumber(twoDoc, "02:30 PM", "04:30 PM");
      await stopRandom();
    } else if (currentTime >= 16 * 3600 && currentTime <= 16 * 3600 + 10) {
      await restartRandom("04:30 PM");
    } else if (
      // 4:30 pm
      currentTime >= 16 * 3600 + 30 * 60 &&
      currentTime < 16 * 3600 + 30 * 60 + 10
    ) {
      await showTwoDLuckyNumber(fourDoc, "04:30 PM", "09:30 AM");
      await stopRandom();
    } else {
      // normal random set, value and lucky number generation
      showRandomNumber();
      await new Promise((resolve) => setTimeout(resolve, 12000));
      showRandomNumber();
      await new Promise((resolve) => setTimeout(resolve, 12000));
      showRandomNumber();
      await new Promise((resolve) => setTimeout(resolve, 12000));
      showRandomNumber();
      await new Promise((resolve) => setTimeout(resolve, 12000));
      showRandomNumber();
    }
  });

exports.onThreeDRandomUpdate = functions.firestore
  .document("randomNumber/3d")
  .onUpdate(async (snap, context) => {
    const dateTimeZone = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Yangon",
    });
    const date = new Date(dateTimeZone);
    const longMonth = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formatData = (input) => {
      if (input > 9) {
        return input;
      } else return `0${input}`;
    };

    let dd = formatData(date.getDate());
    let mm = longMonth[date.getMonth()];
    let yyyy = date.getFullYear();

    let docName = dd + "-" + mm + "-" + yyyy;

    let currentTime =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    // let luckySnap;
    const liveLuckyNumberRef = db.collection("liveNumber").doc("3d");
    // await liveLuckyNumberRef.get().then((snapShot) => {
    //   luckySnap = snapShot.data();
    // });

    const showLuckNum = async () => {
      await db
        .collection("threeDCalendar")
        .where("date", "==", docName)
        .get()
        .then((calendarSnap) => {
          if (calendarSnap.docs.length > 0) {
            let nextSessionIndex;
            const threeDCalendarDoc = calendarSnap.docs[0].data();
            nextSessionIndex = calendarSnap.docs[0].data().index + 1;

            db.collection("threeDLuckyNumbers")
              .doc(docName)
              .get()
              .then(async (snap) => {
                let set_num = (
                  (Math.floor(Math.random() * 900000) +
                    7000000 +
                    Math.ceil(Math.random() * 99) *
                      (Math.round(Math.random()) ? 1 : -1)) /
                  100
                ).toFixed(2);
                let value_num = (
                  (Math.floor(Math.random() * 900000) +
                    1000000 +
                    Math.ceil(Math.random() * 99) *
                      (Math.round(Math.random()) ? 1 : -1)) /
                  100
                ).toFixed(2);
                let fixedSetNumber = "";

                if (snap.exists) {
                  fixedSetNumber = snap.data().luckyNumber + "";
                  let lucky_set_num =
                    set_num.split(".")[0] + "." + fixedSetNumber.slice(0, 2);
                  let lucky_value_num =
                    value_num.split(".")[0] +
                    "." +
                    Math.floor(Math.random() * 9) +
                    fixedSetNumber.slice(2);

                  db.collection("threeDLuckyNumbers")
                    .doc(docName)
                    .update({
                      is_finished: true,
                      timeStamp: admin.firestore.FieldValue.serverTimestamp(),
                    })
                    .then(() => {
                      liveLuckyNumberRef
                        .update({
                          is_finished: true,
                          num1: lucky_set_num,
                          num2: lucky_value_num,
                          luckyNumber: fixedSetNumber + "",
                          time: admin.firestore.FieldValue.serverTimestamp(),
                          upComingSection: "",
                        })
                        .then(() => {
                          db.collection("threeDCalendar")
                            .doc(threeDCalendarDoc.id)
                            .update({
                              isNext: false,
                              is_finished: true,
                              luckyNumber: fixedSetNumber,
                            })
                            .then(() => {
                              console.log(
                                "nex session index ====",
                                nextSessionIndex
                              );
                              db.collection("threeDCalendar")
                                .where("index", "==", nextSessionIndex)
                                .get()
                                .then((snap) => {
                                  console.log(
                                    "next session date ====",
                                    snap.docs[0].data().date
                                  );
                                  if (snap.docs.length > 0) {
                                    const nextThreeDCalendarDoc =
                                      snap.docs[0].data();
                                    db.collection("threeDCalendar")
                                      .doc(nextThreeDCalendarDoc.id)
                                      .update({
                                        isNext: true,
                                      });
                                  }
                                });
                            });
                        });
                    });
                } else {
                  console.log("Lucky number not exist ====");
                  let randomLuckyNumber =
                    set_num.split(".")[1] + value_num.split(".")[1].slice(1);
                  liveLuckyNumberRef
                    .update({
                      is_finished: true,
                      luckyNumber: randomLuckyNumber + "",
                      num1: set_num,
                      num2: value_num,
                      time: admin.firestore.FieldValue.serverTimestamp(),
                      upComingSection: "",
                    })
                    .then(() => {
                      db.collection("threeDLuckyNumbers")
                        .doc(docName)
                        .set({
                          date: docName,
                          id: docName,
                          is_finished: true,
                          luckyNumber: randomLuckyNumber,
                          month: mm + "-" + yyyy,
                          updatedDate: docName,
                          year: yyyy + "",
                          timeStamp:
                            admin.firestore.FieldValue.serverTimestamp(),
                        })
                        .then(() => {
                          db.collection("threeDCalendar")
                            .doc(threeDCalendarDoc.id)
                            .update({
                              isNext: false,
                              is_finished: true,
                              luckyNumber: randomLuckyNumber,
                            })
                            .then(() => {
                              console.log(
                                "nex session index ====",
                                nextSessionIndex
                              );
                              db.collection("threeDCalendar")
                                .where("index", "==", nextSessionIndex)
                                .get()
                                .then((snap) => {
                                  console.log(
                                    "next session date ====",
                                    snap.docs[0].data().date
                                  );
                                  if (snap.docs.length > 0) {
                                    const nextThreeDCalendarDoc =
                                      snap.docs[0].data();
                                    db.collection("threeDCalendar")
                                      .doc(nextThreeDCalendarDoc.id)
                                      .update({
                                        isNext: true,
                                      });
                                  }
                                });
                            });
                        });
                    });
                }
              });
          }
        });
    };
    // currentTime >= 15 * 3600 + 30 * 60 &&
    // currentTime < 15 * 3600 + 30 * 60 + 10
    if (
      currentTime >= 15 * 3600 + 30 * 60 &&
      currentTime < 15 * 3600 + 30 * 60 + 10
    ) {
      await showLuckNum();
    } else {
      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1] + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1] + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1] + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1] + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 900000) +
              7000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 900000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            luckyNumber:
              set_num.split(".")[1] + value_num.split(".")[1].slice(1),
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    }
  });
