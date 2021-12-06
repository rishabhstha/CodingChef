
var tableBody = document.querySelector("#ingredient-table-body");
var count = tableBody.childElementCount;
console.log(count)

var addRow = document.querySelector("#green");
var delRow = document.querySelector("#red");

function setAttributes(el, attrs) {
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

const ingredientListener = () => {
  const ingredientBox = document.querySelector(`#ingredientBox${count}`);
  ingredientBox.addEventListener("change", (event) => {
    const group = ingredient[event.target.value];
    var trackNum = event.target.id;
    trackNum = trackNum.charAt(trackNum.length - 1)
    var select3 = document.querySelector(`#measurement${trackNum}`)
    select3.parentNode.removeChild(select3);

    var select3 = document.createElement("select");
    setAttributes(select3, {
      class: "form-control",
      name: `measurement${trackNum}`,
      required: "true",
      id: `measurement${trackNum}`,
    });
  
    var option3 = document.createElement("option");
    setAttributes(option3, {
      disabled: "true",
      selected: "true",
    });
    option3.text = "Choose measurement";
    select3.appendChild(option3);

    if (group == 1) {
      measurement1.forEach((unit) => {
        var option = document.createElement("option");
        option.text = unit;
        select3.appendChild(option);
      });
    } else if (group == 2) {
      measurement2.forEach((unit) => {
        var option = document.createElement("option");
        option.text = unit;
        select3.appendChild(option);
      });
    } else {
      measurement3.forEach((unit) => {
        var option = document.createElement("option");
        option.text = unit;
        select3.appendChild(option);
      });
    }

    var targetTd = document.querySelector(`#td3-${trackNum}`)
    targetTd.appendChild(select3)

  });
};
//add row function
const addRowFunction = () => {
  count++;
  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  var select1 = document.createElement("select");
  var td2 = document.createElement("td");
  var input2 = document.createElement("input");
  var td3 = document.createElement("td");
  setAttributes(td3, {id: `td3-${count}`})
  var select3 = document.createElement("select");

  setAttributes(tr, { id: `row${count}` });

  setAttributes(select1, {
    class: "form-control",
    name: `ingredient${count}`,
    id: `ingredientBox${count}`,
    required: "true",
  });

  var option1 = document.createElement("option");
  setAttributes(option1, {
    disabled: "true",
    selected: "true",
  });
  option1.text = "Choose ingredient";
  select1.appendChild(option1);

  ingredientList.forEach((ingredient) => {
    var option2 = document.createElement("option");
    option2.text = ingredient;
    select1.appendChild(option2);
  });

  setAttributes(input2, {
    class: "form-control",
    type: "number",
    name: `quantity${count}`,
    placeholder: "Quantity",
    min: "0",
    step: "0.10",
    required: "true",
  });

  setAttributes(select3, {
    class: "form-control",
    name: `measurement${count}`,
    required: "true",
    id: `measurement${count}`,
  });

  var option3 = document.createElement("option");
  setAttributes(option3, {
    disabled: "true",
    selected: "true",
  });
  option3.text = "Choose measurement";
  select3.appendChild(option3);

  td1.appendChild(select1);
  td2.appendChild(input2);
  td3.appendChild(select3);
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tableBody.appendChild(tr);

  ingredientListener();
};

// event listener for plus sign
addRow.addEventListener("click", (e) => {
  addRowFunction();
});

delRow.addEventListener("click", () => {
  var tr = document.querySelector(`#row${count}`);
  tr.parentNode.removeChild(tr);
  count--;
});
