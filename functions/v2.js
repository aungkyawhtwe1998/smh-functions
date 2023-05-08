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
            });
          } else {
            liveLuckyNumberRef.update({
              is_finished: false,
            });
          }
        });
    }

    if (currentTime >= 9 * 3600 && currentTime <= 16 * 3600 + 60) {
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
  });

exports.onRandomUpdate = functions.firestore
  .document("randomNumber/2d")
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

    let todayDate = dd + "-" + mm + "-" + yyyy;
    let nineDoc = "09:30 AM_" + todayDate;
    let twelveDoc = "12:00 PM_" + todayDate;
    let twoDoc = "02:30 PM_" + todayDate;
    let fourDoc = "04:30 PM_" + todayDate;

    let currentTime =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

    let luckySnap = "";

    const liveLuckyNumberRef = db.collection("liveNumber").doc("2d");
    await liveLuckyNumberRef.get().then((snapShot) => {
      luckySnap = snapShot.data();
    });

    const showLuckNum = async (docName, section, upComingSection) => {
      await db
        .collection("twoDLuckyNumbers")
        .doc(docName)
        .get()
        .then(async (snap) => {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              10000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              10000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let fixedSetNumber = "";

          if (snap.exists) {
            fixedSetNumber = snap.data().luckyNumber + "";
            let random1 = Math.floor(Math.random() * 9000000) + 10000;
            let random2 = Math.floor(Math.random() * 9000000) + 10000;
            set_num =
              random1 +
              "." +
              fixedSetNumber.slice(0, 1) +
              Math.floor(Math.random() * 9);
            value_num =
              random2 +
              "." +
              fixedSetNumber.slice(1) +
              Math.floor(Math.random() * 9);
            await db.collection("twoDLuckyNumbers").doc(docName).update({
              is_finished: true,
              timeStamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            await liveLuckyNumberRef.update({
              is_finished: true,
              num1: set_num,
              num2: value_num,
              luckyNumber: fixedSetNumber + "",
              time: admin.firestore.FieldValue.serverTimestamp(),
              upComingSection: upComingSection,
            });
          } else {
            await liveLuckyNumberRef.update({
              is_finished: true,
              luckyNumber:
                set_num.split(".")[1].slice(0, 1) +
                value_num.split(".")[1].slice(1),
              num1: set_num,
              num2: value_num,
              time: admin.firestore.FieldValue.serverTimestamp(),
              upComingSection: upComingSection,
            });
          }
        });
    };
    const stopRandom = async () => {
      if (!luckySnap.is_finished) {
        await liveLuckyNumberRef.update({
          is_finished: true,
        });
      }
    };
    const restartRandom = async (section) => {
      await db
        .collection("sections")
        .where("section", "==", section)
        .get()
        .then((snap) => {
          if (snap.docs[0].data().is_closed) {
            liveLuckyNumberRef.update({
              is_finished: true,
            });
          } else {
            liveLuckyNumberRef.update({
              is_finished: false,
            });
          }
        });
    };

    if (
      currentTime >= 9 * 3600 + 30 * 60 &&
      currentTime < 9 * 3600 + 30 * 60 + 10
    ) {
      await showLuckNum(nineDoc, "09:30 AM", "12:00 PM");
      await stopRandom();
    } else if (
      currentTime >= 11 * 3600 + 30 * 60 &&
      currentTime <= 11 * 3600 + 30 * 60 + 10
    ) {
      await restartRandom("12:00 PM");
    } else if (
      currentTime >= 12 * 3600 &&
      currentTime < 12 * 3600 + 30 * 60 + 10
    ) {
      await showLuckNum(twelveDoc, "12:00 AM", "02:30 PM");
      await stopRandom();
    } else if (currentTime >= 14 * 3600 && currentTime <= 14 * 3600 + 10) {
      await restartRandom("02:30 PM");
    } else if (
      currentTime >= 14 * 3600 + 30 * 60 &&
      currentTime < 14 * 3600 + 30 * 60 + 10
    ) {
      await showLuckNum(twoDoc, "02:30 PM", "04:30 PM");
      await stopRandom();
    } else if (currentTime >= 16 * 3600 && currentTime <= 16 * 3600 + 10) {
      await restartRandom("04:30 PM");
    } else if (
      currentTime >= 16 * 3600 + 30 * 60 &&
      currentTime < 16 * 3600 + 30 * 60 + 10
    ) {
      await showLuckNum(fourDoc, "04:30 PM", "09:30 AM");
      await stopRandom();
    } else {
      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
      //show normal random
      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);

          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await liveLuckyNumberRef.get().then((snapShot) => {
        if (!snapShot.data().is_finished) {
          let set_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          let value_num = (
            (Math.floor(Math.random() * 9000000) +
              1000000 +
              Math.ceil(Math.random() * 99) *
                (Math.round(Math.random()) ? 1 : -1)) /
            100
          ).toFixed(2);
          liveLuckyNumberRef.update({
            num1: set_num,
            num2: value_num,
            time: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    }
  });
