import { Application, Controller } from "./stimulus.js";

function answerObj() {
  const answersObject = {};
  for (let i = 0; i <= 58; i++) {
    answersObject[i] = 2;
  }
  return answersObject
}

const createCircle = (percent) => {
  let circumference = 2* Math.pi * 80 // is a set value in svg
  let offset = (1 - percent) * circumference
  let number = Math.round(percent * 100, 0)

  let svg = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#f5e9c3" stroke-width="20"></circle>

          <circle cx="100" cy="100" r="80" fill="none" stroke="url(#blueGradient)" stroke-width="20"
              stroke-linecap="" stroke-dasharray="502.4" stroke-dashoffset="${offset}"
              transform="rotate(-90, 100, 100)" id="circle-fill"></circle>

          <text x="100" y="100" id="circle-percent" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="36" font-weight="bold">${number}</text>

          <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#308CCE"></stop>
                  <stop offset="100%" stop-color="#91D0FE"></stop>
              </linearGradient>
          </defs>
    </svg>
  `
  let parser = new DOMParser()
  svg = parser.parseFromString(svg, 'image/svg+xml').documentElement
  return svg
}

const createParty = (party, percent) => {
  let svg = createCircle(percent)
  let data = `
      <div class="content-box party-box">
        <div class="party-card">
            <div class="left-column">
                <div>
                    <div class="logo-placeholder mb-5"></div>
                    <h3>${party.fullname}</h3>
                    <div class="text-secondary text-ss italic">${party.leaning}</div>
                </div>
                <p class="party-description text-ss mt-2">${party.blurb}</p>
            </div>
            <div class="right-column">
            </div>
        </div>
    </div>
  `
  let parser = new DOMParser()
  let div = parser.parseFromString(data, "text/html")

  try {
    div.querySelector(".right-column").insertAdjacentElement(0, svg)
  } catch (e){
    console.error(e)
  }

  return div
}

const questionContent = `


`

class QuestionController extends Controller {
  static targets = [
    "answer",
    "content",
    "complete",
    "circleFragment",
    "next",
    "number",
    "previous",
    "question",
    "result",
    "theme",
    "total_q",
    "type",
  ]

  async initialize() {
    await this.loadQuestions()
    await this.loadPartyData()
  }

  connect() {
    this.currentQuestion = 0
    this.userAnswers = {}
  }

  init(event) {
    // Test the last questions.
    this.userAnswers = answerObj()
    this.currentQuestion = 23
    let questions = event.detail

    this.shortQuestions = questions.filter((q) => { return q.short })
    this.longQuestions = questions.filter((q) => { return !q.short })

    this.questions = this.shortQuestions
    this.totalQ = this.questions.length
    this.halfway = false

    console.log(this.shortQuestions, this.longQuestions)
    this.setQuestion(this.currentQuestion)
  }

  setQuestion(num) {
    this.currentQuestion = num
    this.questionTarget.innerHTML = this.questions[num].pergunta
    this.total_qTarget.innerHTML = this.totalQ
    this.typeTarget.innerHTML = this.questions[num].type
    this.themeTarget.innerHTML = this.questions[num].theme
    this.numberTarget.innerHTML = this.currentQuestion + 1
  }

  setExistingAnswer() {
    let answer = this.userAnswers[this.currentQuestion]
    this.answerTargets.map((target) => {
      if (answer == undefined) {
        target.checked = false
      } else if (parseInt(target.value) ==  answer || isNaN(answer)) {
        target.checked = true
      } else {
        // target does not match, do nothing.
      }
    })
  }

  next() {
    if (!this.canProceed() || this.showHalfway(this.currentQuestion + 1)) {
      return
    }

    this.setQuestion(this.currentQuestion + 1)
    this.setExistingAnswer()
    this.canProceed()
    console.log(this.userAnswers)
  }

  previous() {
    this.setQuestion(this.currentQuestion - 1)
    this.setExistingAnswer()
    this.canProceed()
    console.log(this.userAnswers)
  }

  showHalfway(num) {
    if (num == this.shortQuestions.length) {
      this.nextTarget.classList.add("hidden")
      this.previousTarget.classList.add("hidden")
      this.completeTarget.classList.remove("hidden")
      // should hide prev and next.
      this.contentTarget.innerHTML = `
        <div class="text-m center flex-column auto">
          <p>Respondeu a 24 das 60 perguntas.</p>
          <p>Pare aqui ou prossiga com o teste completo.</p>

          <div class="review">
            <span class="text-ss text-secondary">Mudou de ideias?</span>
            <span class="text-ss underline" data-action="click->question#review">
              Respostas da revisão
            </span>
          </div>
        </div>
      `
      return true
    }

  }

  showResults() {
    this.resultTarget.classList.remove("hidden")
    this.resultTarget.classList.remove("invisible")
    let div = document.createElement("div")

    div.innerHTML = createParty(this.parties.ad, 0.69)
    this.resultTarget.insertAdjacentElement(0, div)
  }

  review() {
    console.log("review")
  }

  canProceed() {
    let isChecked = this.answerTargets.filter((target) => target.checked == true).length >= 1
    if (this.userAnswers[this.currentQuestion] != undefined || isChecked ) {
      this.nextTarget.removeAttribute("disabled")
      return true
    }
    this.nextTarget.setAttribute("disabled", "disabled")
    return false
  }

  answer(event) {
    this.userAnswers[this.currentQuestion] = {
      answer: parseInt(event.target.value),
      index: this.questions[this.currentQuestion].index
    }
    this.canProceed()
  }

  async loadQuestions() {
    try {
      const response = await fetch('./questions.json');
      const data = await response.json();
      this.dispatch("ready", {detail: data})
      return data;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  }

  async loadPartyData() {
    try {
      const response = await fetch('./party_info.json');
      const data = await response.json();
      this.parties = data
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  }

}


window.Stimulus = Application.start()
Stimulus.register("question", QuestionController)

console.log("hello world")
