let selectedFile;
document.getElementById("input-list").addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
});
let selectedFileSecond;
document.getElementById("input-listWE").addEventListener("change", (event) => {
  selectedFileSecond = event.target.files[0];
});

document.getElementById("button").addEventListener("click", () => {
  if (selectedFile && selectedFileSecond) {
    //Render wyList
    let secondFileReader = new FileReader();
    secondFileReader.readAsBinaryString(selectedFileSecond);
    secondFileReader.onload = (event) => {
      let data = event.target.result;
      let workbook = XLSX.read(data, { type: "binary" });
      workbook.SheetNames.forEach((sheet) => {
        //Convert wyList to json object
        let weList = XLSX.utils.sheet_to_row_object_array(
          workbook.Sheets[sheet]
        );

        //Render weList
        let fileReader = new FileReader();
        fileReader.readAsBinaryString(selectedFile);
        fileReader.onload = (event) => {
          let data = event.target.result;
          let workbook = XLSX.read(data, { type: "binary" });
          workbook.SheetNames.forEach((sheet) => {
            //Convert weList to json object
            let dataList = XLSX.utils.sheet_to_row_object_array(
              workbook.Sheets[sheet]
            );

            if (
              !weList.LP ||
              !weList.NR_ALB ||
              !weList["NAZWISKO, Imię"] ||
              !data["Imię i nazwisko"] ||
              !data["Akcja użytkownika"] ||
              !data["Znacznik czasu"]
            ) {
              document.querySelector("#errorMessage").innerHTML =
                "Błędny format danych";
              document.querySelector("#successMessage").innerHTML = "";
            }

            //Present indexes
            const regExp = /\(([^)]+)\)/;
            const presentIndexes = dataList.map((user) =>
              parseInt(regExp.exec(user["Imię i nazwisko"])[1], 10)
            );

            //Present indexes withour duplicates
            const indexesWithoutDuplicate = presentIndexes.filter(
              (val, index) => presentIndexes.indexOf(val) === index
            );

            //All indexes
            const weListIndexes = weList.map((user) => user.NR_ALB);

            //Absent indexes
            const absent = weListIndexes.filter(
              (album) => !indexesWithoutDuplicate.includes(album)
            );

            //Finished data
            //Create object with absent and present users
            let finishData = [];
            let currentDate = dataList[0]["Znacznik czasu"].split(",")[0];
            weList
              .filter((data) => String(data.NR_ALB).trim() !== "")
              .forEach((singleUser) => {
                let isPresent = absent.includes(singleUser.NR_ALB) ? 0 : 1;
                //Copy of the main object and adding sum
                const sum = singleUser["Suma"]
                  ? singleUser["Suma"] + isPresent
                  : isPresent;
                const copy = { ...singleUser };
                delete copy["Suma"];
                finishData.push({
                  ...copy,
                  [currentDate]: isPresent,
                  ["Suma"]: sum,
                });
              });
            downloadAsExcel(finishData);
            document.querySelector("#errorMessage").innerHTML = "";
            document.querySelector("#successMessage").innerHTML =
              "Dane przekonwertowane pomyślnie";
          });
        };
      });
    };
  } else {
    document.querySelector("#successMessage").innerHTML = "";
    document.querySelector("#errorMessage").innerHTML =
      "Upewnij się, że zostały dodane wymagane pliki";
  }
});

const formatDate = (date) => {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  month = month.length < 2 ? `0${month}` : month;
  dat = day.length < 2 ? `0${day}` : day;

  return [year, month, day].join("-");
};

const EXCEL_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const EXCEL_EXTENSION = ".xlsx";

const downloadAsExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = [{ wpx: 50 }, { wpx: 60 }, { wpx: 150 }];
  const workbook = {
    Sheets: {
      ["Lista"]: worksheet,
    },
    SheetNames: ["Lista"],
  };
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAsExcel(excelBuffer);
};

const saveAsExcel = (buffer) => {
  const data = new Blob([buffer], { type: EXCEL_TYPE });
  saveAs(data, `ListaWY-${formatDate(Date.now())}${EXCEL_EXTENSION}`);
};
