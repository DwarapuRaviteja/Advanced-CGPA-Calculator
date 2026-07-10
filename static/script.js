const semesterContainer = document.getElementById("semesterContainer")
const loader = document.getElementById("loader")
const errorDiv = document.getElementById("error")
let semesterCount = 0

function addSemester(){
    semesterCount++

    const div = document.createElement("div")
    div.className = "semesterBlock"

    div.innerHTML = `
    <h2>Semester ${semesterCount}</h2>
    <input type="file" accept="image/*,.jpg,.jpeg,.png" onchange="uploadImage(this,${semesterCount})">
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
    div.scrollIntoView({

    behavior:"smooth",

    block:"start"

})

const fileInput=div.querySelector("input[type='file']")

setTimeout(()=>{

    fileInput.click()

},300)
}

function uploadImage(input,id){

    const file=input.files[0]

    if(!file) return

    clearError()

    loader.classList.remove("hidden")

    const formData=new FormData()

    formData.append("image",file)

    fetch("/analyze",{

        method:"POST",

        body:formData

    })

    .then(res=>res.json())

    .then(data=>{

        loader.classList.add("hidden")

        if(!data.valid){

            showError("Invalid academic result image.")

            return

        }

        const tbody=document.querySelector(`#table${id} tbody`)

        tbody.innerHTML=""

        data.subjects.forEach(sub=>{

            const row=document.createElement("tr")

            row.innerHTML=`

            <td contenteditable="false">${sub.code||""}</td>

            <td contenteditable="false">${sub.name||""}</td>

            <td contenteditable="false">${sub.credits||""}</td>

            <td contenteditable="false">${sub.grade||""}</td>

            <td>

                <button onclick="deleteRow(this)">Delete</button>

            </td>

            `

            tbody.appendChild(row)

        })

        enableEdit(id)

        calculateAll()

        document.querySelector(`#table${id}`).scrollIntoView({

            behavior:"smooth",

            block:"center"

        })

        setTimeout(()=>{

            document.getElementById("finalResult").scrollIntoView({

                behavior:"smooth",

                block:"start"

            })

        },700)

    })

    .catch(()=>{

        loader.classList.add("hidden")

        showError("Server error. Please try again.")

    })

}

function enableEdit(id){

    document.querySelectorAll(`#table${id} tbody td`).forEach(td=>{

        if(td.cellIndex!==4){

            td.contentEditable="true"

            td.addEventListener("blur",calculateAll)

            td.addEventListener("keyup",e=>{

                if(e.key==="Enter"){

                    e.preventDefault()

                    td.blur()

                }

            })

        }

    })

}

function addRow(id){
    const tbody = document.querySelector(`#table${id} tbody`)
    const row = document.createElement("tr")

    row.innerHTML = `
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td><button onclick="deleteRow(this)">Delete</button></td>
    `

    tbody.appendChild(row)
    row.querySelectorAll("td").forEach(td=>{

    if(td.cellIndex!==4){

        td.addEventListener("blur",calculateAll)

        td.addEventListener("keyup",e=>{

            if(e.key==="Enter"){

                e.preventDefault()

                td.blur()

            }

        })

    }

})
}

function deleteRow(btn){

    btn.closest("tr").remove()

    calculateAll()

}

function calculateAll(){

    const semesters=[]

    clearError()

    for(let i=1;i<=semesterCount;i++){

        const rows=document.querySelectorAll(`#table${i} tbody tr`)

        if(rows.length===0) continue

        const subjects=[]

        rows.forEach(row=>{

            const td=row.querySelectorAll("td")

            if(td.length<4) return

            const credits=td[2].innerText.trim()
            const grade=td[3].innerText.trim()

            if(credits!=="" && grade!==""){

                subjects.push({

                    code:td[0].innerText.trim(),

                    name:td[1].innerText.trim(),

                    credits,

                    grade

                })

            }

        })

        if(subjects.length) semesters.push(subjects)

    }

    if(!semesters.length){

        finalResult.classList.add("hidden")

        return

    }

    loader.classList.remove("hidden")

    fetch("/calculate",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({semesters})

    })

    .then(res=>res.json())

    .then(data=>{

        loader.classList.add("hidden")

        finalResult.classList.remove("hidden")

        animateValue("cgpaValue",data.cgpa)

        animateValue("percentageValue",data.percentage)

        updateCircle(parseFloat(data.cgpa))

        updateBadge(parseFloat(data.cgpa))

        showAnalysis(parseFloat(data.cgpa))

        celebrate(parseFloat(data.cgpa))

        const result=document.getElementById("semesterResults")

        result.innerHTML=""

        data.semester_sgpa.forEach((sgpa,index)=>{

            result.innerHTML+=`

            <div class="sgpaCard fadeIn">

                <h3>Semester ${index+1}</h3>

                <div class="sgpaValue">${sgpa}</div>

                <div class="sgpaText">Semester GPA</div>

            </div>

            `

        })

        setTimeout(()=>{

            finalResult.scrollIntoView({

                behavior:"smooth",

                block:"start"

            })

        },300)

    })

    .catch(()=>{

        loader.classList.add("hidden")

        showError("Calculation failed. Please try again.")

    })

}

async function downloadPDF(){

    const {jsPDF}=window.jspdf
    const pdf=new jsPDF("p","mm","a4")

    const pageWidth=pdf.internal.pageSize.getWidth()
    const pageHeight=pdf.internal.pageSize.getHeight()

    let y=18

    const cgpa=document.getElementById("cgpaValue").innerText
    const percentage=document.getElementById("percentageValue").innerText
    const badge=document.getElementById("performanceBadge").innerText
    const analysis=document.getElementById("analysisText").innerText

    pdf.setFillColor(33,150,243)
    pdf.rect(0,0,pageWidth,25,"F")

    pdf.setTextColor(255,255,255)
    pdf.setFont("helvetica","bold")
    pdf.setFontSize(20)
    pdf.text("ADVANCED CGPA CALCULATOR REPORT",pageWidth/2,15,{align:"center"})

    pdf.setTextColor(0,0,0)

    y=35

    pdf.setFontSize(10)
    pdf.setFont("helvetica","normal")
    pdf.text("Generated : "+new Date().toLocaleString(),14,y)

    y+=10

    pdf.setDrawColor(220)
    pdf.roundedRect(14,y,182,28,3,3)

    pdf.setFont("helvetica","bold")
    pdf.setFontSize(14)
    pdf.text("Overall Summary",18,y+8)

    pdf.setFont("helvetica","normal")
    pdf.setFontSize(11)

    pdf.text("CGPA : "+cgpa,18,y+17)
    pdf.text("Percentage : "+percentage,70,y+17)
    pdf.text("Badge : "+badge,140,y+17)

    y+=40

    const sgpaCards=document.querySelectorAll(".sgpaValue")

    for(let i=1;i<=semesterCount;i++){

        const rows=document.querySelectorAll(`#table${i} tbody tr`)
        if(rows.length===0) continue

        pdf.setFillColor(240,248,255)
        pdf.roundedRect(14,y-2,182,10,2,2,"F")

        pdf.setFont("helvetica","bold")
        pdf.setFontSize(13)
        pdf.text("Semester "+i,18,y+5)

        const table=[]

        rows.forEach(r=>{

            const td=r.querySelectorAll("td")

            table.push([
                td[0].innerText.trim(),
                td[1].innerText.trim(),
                td[2].innerText.trim(),
                td[3].innerText.trim()
            ])

        })

        pdf.autoTable({

            startY:y+10,

            head:[["Code","Subject","Credits","Grade"]],

            body:table,

            theme:"striped",

            styles:{
                fontSize:9,
                cellPadding:3
            },

            headStyles:{
                fillColor:[33,150,243],
                textColor:255
            },

            alternateRowStyles:{
                fillColor:[248,248,248]
            }

        })

        y=pdf.lastAutoTable.finalY+8

        if(sgpaCards[i-1]){

            pdf.setFont("helvetica","bold")
            pdf.setFontSize(11)
            pdf.text("Semester SGPA : "+sgpaCards[i-1].innerText,16,y)

            y+=10

        }

        if(y>240){

            pdf.addPage()
            y=20

        }

    }

    pdf.setDrawColor(180)
    pdf.line(14,y,196,y)

    y+=10

    pdf.setFont("helvetica","bold")
    pdf.setFontSize(14)
    pdf.text("AI Performance Analysis",14,y)

    y+=8

    pdf.setFont("helvetica","normal")
    pdf.setFontSize(11)

    const cleanAnalysis=analysis
    .replace(/•.*/gs,"")
    .replace("Suggestions","")
    .trim()

const lines=pdf.splitTextToSize(cleanAnalysis,180)

    pdf.text(lines,14,y)

    const totalPages=pdf.getNumberOfPages()

    for(let i=1;i<=totalPages;i++){

        pdf.setPage(i)

        pdf.setFontSize(9)

        pdf.setTextColor(120)

        pdf.text(
            "Advanced CGPA Calculator",
            14,
            pageHeight-8
        )

        pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth-35,
            pageHeight-8
        )

    }

    const now=new Date()

    const fileName=`CGPA_Report_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}-${String(now.getMinutes()).padStart(2,"0")}.pdf`

    pdf.save(fileName)

}

function animateValue(id,value){

    const element=document.getElementById(id)

    if(!element) return

    const end=parseFloat(value)

    if(isNaN(end)) return

    const isPercentage=id==="percentageValue"

    const current=parseFloat(element.innerText)||0

    if(Math.abs(current-end)<0.01){

        element.innerText=isPercentage?end.toFixed(2)+"%":end.toFixed(2)
        return

    }

    let start=current

    const duration=800

    const increment=(end-start)/40

    clearInterval(element.animationTimer)

    element.animationTimer=setInterval(()=>{

        start+=increment

        if((increment>0&&start>=end)||(increment<0&&start<=end)){

            start=end

            clearInterval(element.animationTimer)

        }

        element.innerText=isPercentage
            ?start.toFixed(2)+"%"
            :start.toFixed(2)

    },duration/40)

}



function updateCircle(cgpa){

    const circle=document.getElementById("progressCircle")

    if(!circle) return

    const radius=90
    const circumference=2*Math.PI*radius

    circle.style.strokeDasharray=circumference

    const offset=circumference-(cgpa/10)*circumference

    circle.style.transition="stroke-dashoffset 1.5s ease, stroke .8s ease, filter .8s ease"

    circle.style.strokeDashoffset=offset

    let color="#f44336"

    if(cgpa>=9.5)
        color="#FFD700"
    else if(cgpa>=8.75)
        color="#00E676"
    else if(cgpa>=8.2)
        color="#00BCD4"
    else if(cgpa>=7.5)
        color="#42A5F5"
    else if(cgpa>=6.5)
        color="#AB47BC"

    circle.style.stroke=color

    circle.style.filter=`drop-shadow(0 0 12px ${color})`

}



function updateBadge(cgpa){

    const badge=document.getElementById("performanceBadge")
    const desc=document.getElementById("badgeDescription")

    if(!badge||!desc) return

    badge.className="badge"
    badge.classList.add("counterAnimation")

    let title=""
    let message=""
    let cls=""

    if(cgpa>=9.5){

        title="🏆 OUTSTANDING"
        cls="outstanding"
        message="Exceptional academic performance! You're among the top performers. Keep maintaining this outstanding consistency."

    }
    else if(cgpa>=8.75){

        title="🌟 EXCELLENT"
        cls="excellent"
        message="Excellent performance! You're building a strong academic profile for placements and higher studies."

    }
    else if(cgpa>=8.2){

        title="🎉 VERY GOOD"
        cls="verygood"
        message="Very good work! A little more effort can take you into the Excellent category."

    }
    else if(cgpa>=7.5){

        title="👍 GOOD"
        cls="good"
        message="Good performance. Focus on improving high-credit subjects to boost your CGPA."

    }
    else if(cgpa>=6.5){

        title="📘 NICE"
        cls="nice"
        message="Nice progress. Keep practicing consistently and you'll see steady improvement."

    }
    else{

        title="💪 KEEP IMPROVING"
        cls="improve"
        message="Every semester is a new opportunity. Stay consistent and your CGPA will improve."

    }

    badge.innerText=title
    badge.classList.add(cls,"glow","shine")

    desc.innerHTML=`
        <strong>${title}</strong><br><br>
        ${message}
    `

    setTimeout(()=>{
        badge.classList.remove("counterAnimation")
    },700)

}

function showAnalysis(cgpa){

    const txt=document.getElementById("analysisText")

    if(!txt) return

    let title=""
    let analysis=""
    let tips=[]

    if(cgpa>=9.5){

        title="🏆 Outstanding Performance"

        analysis="Your academic record is exceptional. You have maintained an excellent level of consistency across your semesters."

        tips=[
            "• Continue your current study strategy.",
            "• Focus on internships and research projects.",
            "• Build your GitHub and portfolio.",
            "• Prepare for top product companies."
        ]

    }
    else if(cgpa>=8.75){

        title="🌟 Excellent Performance"

        analysis="You have achieved an excellent CGPA. A little more consistency can move you into the Outstanding category."

        tips=[
            "• Revise subjects regularly.",
            "• Improve scores in high-credit subjects.",
            "• Participate in hackathons.",
            "• Strengthen DSA and Full Stack skills."
        ]

    }
    else if(cgpa>=8.2){

        title="🎉 Very Good Performance"

        analysis="Your performance is very good and shows steady academic progress."

        tips=[
            "• Focus on difficult subjects.",
            "• Practice previous papers.",
            "• Improve lab performance.",
            "• Maintain attendance."
        ]

    }
    else if(cgpa>=7.5){

        title="👍 Good Performance"

        analysis="You have a good academic record. Small improvements each semester will significantly increase your CGPA."

        tips=[
            "• Give extra time to weak subjects.",
            "• Complete assignments early.",
            "• Improve internal marks.",
            "• Revise every week."
        ]

    }
    else if(cgpa>=6.5){

        title="📘 Nice Progress"

        analysis="You are progressing well. Consistency and regular practice will help you reach a much higher CGPA."

        tips=[
            "• Build a study timetable.",
            "• Solve more problems daily.",
            "• Ask faculty whenever you have doubts.",
            "• Improve exam preparation."
        ]

    }
    else{

        title="💪 Keep Improving"

        analysis="Every semester is a fresh opportunity. Don't focus on past scores—focus on improving from today."

        tips=[
            "• Study daily.",
            "• Strengthen fundamentals.",
            "• Practice coding regularly.",
            "• Stay positive and consistent."
        ]

    }

    txt.innerHTML=`
        <h3>${title}</h3>
        <br>
        <p>${analysis}</p>
        <br>
        <strong>Suggestions</strong>
        <br><br>
        ${tips.join("<br>")}
    `

}

let celebrationPlayed=false

let lastBadge=""
let celebrationTimer=null
function celebrate(cgpa){

    const overlay=document.getElementById("celebrationOverlay")
    const title=document.getElementById("badgeTitle")
    const emoji=document.getElementById("badgeEmoji")
    const msg=document.getElementById("badgeMessage")

    if(!overlay||!title||!emoji||!msg) return

    let badge=""
    let particles=0
    let spread=0
    let velocity=0
    let icon=""
    let message=""

    if(cgpa>=9.5){

        badge="OUTSTANDING"
        icon="🏆"
        particles=500
        spread=220
        velocity=65
        message="Outstanding Achievement! You are among the top performers."

    }
    else if(cgpa>=8.75){

        badge="EXCELLENT"
        icon="🌟"
        particles=400
        spread=200
        velocity=60
        message="Excellent Performance! Keep maintaining your consistency."

    }
    else if(cgpa>=8.2){

        badge="VERY GOOD"
        icon="🎉"
        particles=300
        spread=180
        velocity=55
        message="Very Good Performance! You're moving towards excellence."

    }
    else if(cgpa>=7.5){

        badge="GOOD"
        icon="👏"
        particles=180
        spread=150
        velocity=45
        message="Good Job! Keep improving every semester."

    }
    else{

        return

    }

    if(lastBadge===badge) return

    lastBadge=badge

    title.innerText=badge
    emoji.innerText=icon
    msg.innerText=message

    console.log("Celebration Started")
    overlay.classList.remove("hidden")

    if(typeof confetti==="function"){

        confetti({
            particleCount:particles,
            spread:spread,
            startVelocity:velocity,
            scalar:1.2,
            origin:{y:.65}
        })

        setTimeout(()=>{

            confetti({
                particleCount:particles/2,
                spread:120,
                origin:{x:.2,y:.45}
            })

            confetti({
                particleCount:particles/2,
                spread:120,
                origin:{x:.8,y:.45}
            })

        },500)

    }

    clearTimeout(celebrationTimer)

    celebrationTimer=setTimeout(()=>{

        console.log("Celebration Ended")
        overlay.classList.add("hidden")

    },3000)

}

function clearError(){

    errorDiv.innerText=""

    errorDiv.classList.add("hidden")

}

function showError(message){

    errorDiv.innerText=message

    errorDiv.classList.remove("hidden")

    setTimeout(()=>{

        errorDiv.classList.add("hidden")

    },4000)

}