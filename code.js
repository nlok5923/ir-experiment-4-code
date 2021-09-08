const { spawn } = require("child_process");
const fs = require("fs");

let size = 10;
let start = 0;
// the queries array will help us to store all the queries at one place
let queries = [];
//map array will help us to store the mapping of weights corresponding to map score
let map = [];

//initializing the empty 2d array to store the wieghts and corresponding map score with that particular weight og title and date
for (let i = start; i < size; i++) {
  map[i] = new Array();
}

// filling values with zero initially
for (let i = start; i < size; i++) {
  for (let j = start; j < size; j++) {
    map[i][j] = 0;
  }
}

// creating stream so to as able to write to file called Output.txt which will hold information about
// the weights and corresponding map score
var logger = fs.createWriteStream("Output.txt", {
  flags: "a", // 'a' means appending (old data will be preserved)
});

// this function will help to log all the scores to the output.txt file
const printTheScore = () => {
  for (let i = start+1; i < size; i++) {
    for (let j = start+1; j < size; j++) {
      if (map[i][j] != 0) {
        //here we are averaging out our precision value to obtain average
        map[i][j] = map[i][j] / 225;
        //logging result in output.txt file
        logger.write(
          "for weight " +
            i +
            " " +
            "for title and " +
            j +
            " for date map score is: " +
            map[i][j] +
            "\n"
        );
      }
    }
  }
  console.log("code executed successfully !!");
};

/*
 * This functions helps to get precision for a particular query it requires the doc id of retreived documents and the actual docid for the query
 */

const getPrecision = (retreivalQueryDocId, retreivedId, queryNo) => {
  let matches = 0;
  let actualMatches = retreivalQueryDocId[queryNo];
  //handling edge cases of undefined array
  if (actualMatches != undefined && retreivedId != undefined) {
    //below login helps to find no of relevant document out of total retreived documents
    for (let i = 0; i < actualMatches.length; i++) {
      for (let j = 0; j < retreivedId.length; j++) {
        if (actualMatches[i] === retreivedId[j]) {
          ++matches;
        }
      }
    }
  }
  // matches says total relevant doc out of retreived doc and 10 says no of retreived doc
  return parseInt(matches) / 10;
};

// query.txt file contains all the query which we need to execute
fs.readFile("query.txt", "utf-8", (err, data) => {
  if (err) throw err;
  let preData = data.split("\r\n");
  let i = 0;

  // preprocessing the data so as to extract the exact query statements
  while (i < preData.length) {
    let temp = "";
    if (preData[i] != undefined) {
      while (preData[i].length > 6 || preData[i][0] != ".") {
        temp += preData[i];
        i++;
        if (preData[i] == undefined) break;
      }
    }

    //pushing the exact query statement into the queries array
    queries.push(temp);
    i++;
  }

  //while preprocessing certain unnecessary queries may get into final queries array so filtering it
  queries = queries.filter((query) => query != "");

  // the cranqrel file contains the actual mapping of the relevant doc id corresponding to a particular query
  fs.readFile("cranqrel.txt", "utf-8", (err, data) => {
    if (err) throw err;
    let retreival = [];
    let temp = "";

    //again preprocessing the data which is fetched from cranqrel file and converting to a 2d array which will gonna hold the valid doc id corresponding to the query no
    // so as to make the actual doc id retreivel easy
    for (let i = 0; i < data.length; i++) {
      temp += data[i];
      if (data[i] == "\n") {
        retreival.push(temp);
        temp = "";
      }
    }

    let retreivalQueryDocId = [];

    retreival.map((data) => retreivalQueryDocId.push(data.slice(0, -1)));

    //little bit more preprocessing over the fetched data so as to make it usable
    let queryToDocId = [];
    let arr = [];
    let preVal = "";
    for (let i = 0; i < retreivalQueryDocId.length; i++) {
      let temp = retreivalQueryDocId[i];
      let queryNo = "",
        docId = "",
        value = "";
      let st = 0;
      for (let j = 0; j < temp.length; j++) {
        if (j == 0) {
          value += temp[j];
        } else {
          if (temp[j] == " ") {
            st++;
            if (st == 1) {
              queryNo = value;
              value = "";
            } else if (st == 2) {
              docId = value;
              value = "";
            }
          } else {
            value += temp[j];
          }
        }
      }

      if (i == 0) {
        preVal = queryNo;
        arr.push(docId);
      } else {
        if (queryNo == preVal) {
          arr.push(docId);
        } else {
          queryToDocId.push(arr);
          arr = [];
          preVal = queryNo;
        }
      }
    }

    // the weightTitle variable helps us the vary the weight for the title field
    for (let weightTitle = start + 1; weightTitle <= size - 1; weightTitle++) {
      //similarly the weightDate variable help us to vary the weight for the date field
      for (let weightDate = start + 1; weightDate <= size - 1; weightDate++) {
        //querying over all the queries with a particular weight for title and date
        for (let q = 0; q < queries.length; q++) {
          //starting a py thread so as to run python script to fetch the result for query and passing both the weights query text and query no as parameter
          const python = spawn("python", [
            "getDataScript.py",
            queries[q],
            weightTitle,
            weightDate,
            q + 1,
          ]);

          //listening to data event the event which get triggered when the python scripts print some data in it's execution cycle
          python.stdout.on("data", function (data) {
            //preprocessing the data which contains the retreived doc id corresponding to the asked query
            let valid = data.toString().split(" ");
            // the valid array contain the retrieved doc id corresponding to asked query
            valid = valid[0].split("\r\n");
            let queryId = valid[0];
            valid[0] = -1;
            // saving the precision value corresponding to weights of title and date
            map[weightTitle][weightDate] += getPrecision(
              queryToDocId,
              valid,
              queryId
            );
            if (
              weightTitle === size - 1 &&
              weightDate === size - 1 &&
              q === queries.length - 1
            ) {
              //printing the results in output.txt once all the execution comes to an end
              printTheScore();
            }
          });
        }
      }
    }
  });
});
