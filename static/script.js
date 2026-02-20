const semesterContainer = document.getElementById("semesterContainer")
const loader = document.getElementById("loader")
const errorDiv = document.getElementById("error")
const calculateAllBtn = document.getElementById("calculateAll")
let semesterCount = 0

function addSemester(){
    semesterCount++
    const div = document.createElement("div")
    div.className="semesterBlock"
    div.innerHTML=`
    <h2>Semester ${semesterCount}</h2>
    <input type="file" accept="image/*,.jpg,.jpeg,.png" capture="environment" onchange="uploadImage(this,${semesterCount})">
    <table id="table${semesterCount}">
    <thead>
    <tr>
    <th>Code</th>
    <th>Subject</th>
    <th>Credits</th>
    <th>Grade</th>
    <th>Action</th>
    </tr>
    </thead>
    <tbody></tbody>
    </table>
    <button onclick="enableEdit(${semesterCount})">Edit</button>
    <button onclick="addRow(${semesterCount})">Add Row</button>
    `
    semesterContainer.appendChild(div)
}

function uploadImage(input,id){
    const file = input.files[0]
    if(!file) return

    loader.classList.remove("hidden")

    const formData = new FormData()
    formData.append("image",file)

    fetch("/analyze",{method:"POST",body:formData})
    .then(res=>res.json())
    .then(data=>{
        loader.classList.add("hidden")
        if(!data.valid){
            errorDiv.innerText="Invalid result image"
            errorDiv.classList.remove("hidden")
            return
        }

        const tbody = document.querySelector(`#table${id} tbody`)
        tbody.innerHTML=""

        data.subjects.forEach(sub=>{
            const row=document.createElement("tr")
            row.innerHTML=`
            <td contenteditable="false">${sub.code}</td>
            <td contenteditable="false">${sub.name}</td>
            <td contenteditable="false">${sub.credits}</td>
            <td contenteditable="false">${sub.grade}</td>
            <td><button onclick="deleteRow(this)">Delete</button></td>
            `
            tbody.appendChild(row)
        })

        calculateAllBtn.classList.remove("hidden")
    })
}

function enableEdit(id){
    document.querySelectorAll(`#table${id} td`).forEach(td=>{
        if(td.cellIndex!==4) td.contentEditable="true"
    })
}

function addRow(id){
    const tbody=document.querySelector(`#table${id} tbody`)
    const row=document.createElement("tr")
    row.innerHTML=`
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td><button onclick="deleteRow(this)">Delete</button></td>
    `
    tbody.appendChild(row)
}

function deleteRow(btn){
    btn.parentElement.parentElement.remove()
}

function calculateAll(){
    const semesters=[]
    for(let i=1;i<=semesterCount;i++){
        const rows=document.querySelectorAll(`#table${i} tbody tr`)
        let subjects=[]
        rows.forEach(row=>{
            const cells=row.querySelectorAll("td")
            subjects.push({
                code:cells[0].innerText,
                name:cells[1].innerText,
                credits:cells[2].innerText,
                grade:cells[3].innerText
            })
        })
        semesters.push(subjects)
    }

    fetch("/calculate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({semesters})
    })
    .then(res=>res.json())
    .then(data=>{
        document.getElementById("finalResult").classList.remove("hidden")
        document.getElementById("cgpa").innerText="Overall CGPA : "+data.cgpa
        document.getElementById("percentage").innerText="Overall Percentage : "+data.percentage+"%"

        let semText=""
        data.semester_sgpa.forEach((sgpa,index)=>{
            semText+=`Semester ${index+1} SGPA : ${sgpa}<br>`
        })
        document.getElementById("semesterResults").innerHTML=semText
    })
}
