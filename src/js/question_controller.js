import { Application, Controller } from "./stimulus.js";

function answerObj() {
  const answersObject = {};
  for (let i = 0; i <= 58; i++) {
    answersObject[i] = 2;
  }
  return answersObject
}

const createCircle = (percent) => {
  let circleTemplate = document.getQuerySelector("#circleFragment")
  parser = new DOMParser()
  let svg = parser.parseFromString(circleTemplate.innerHTML, 'image/svg+xml').documentElement

  let circumference = 2* Math.pi * 80 // is a set value in svg
  let offset = (1 - percentage) * circumference
  let number = Math.round(percent * 100, 0)

  svg.getQuerySelector("#circle-fill").setAttribute("stroke-dashoffset", offset)
  svg.getQuerySelector("#circle-percent").innerText = number
  return svg
}


class QuestionController extends Controller {
  static targets = [
    "answer",
    "circleFragment",
    "next",
    "number",
    "previous",
    "question",
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
    // this.userAnswers = answerObj()
    // this.currentQuestion = 22
    let questions = event.detail

    this.shortQuestions = questions.filter((q) => { return q.short })
    this.longQuestions = questions.filter((q) => { return !q.short })

    this.questions = this.shortQuestions
    this.totalQ = this.questions.length

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
    if (!this.canProceed()) {
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
      this.opinions = data
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  }

}


window.Stimulus = Application.start()
Stimulus.register("question", QuestionController)

console.log("hello world")
