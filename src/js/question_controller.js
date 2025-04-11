import { Application, Controller } from "./stimulus.js";

class QuestionController extends Controller {
  static targets = [
    "question",
    "number",
    "type",
    "theme",
    "next",
    "previous",
    "answer"
  ]

  async initialize() {
    await this.loadQuestions()
    await this.loadOpinions()
  }

  connect() {
    this.currentQuestion = 0
    this.userAnswers = {}
  }

  init(event) {
    this.setQuestion(this.currentQuestion)
  }

  setQuestion(num) {
    this.currentQuestion = num
    this.questionTarget.innerHTML = this.questions[num].pergunta
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
    this.userAnswers[this.currentQuestion] = parseInt(event.target.value)
    this.canProceed()
  }

  async loadQuestions() {
    try {
      const response = await fetch('./questions.json');
      const data = await response.json();
      this.questions = data
      this.dispatch("ready")
      return data;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  }

  async loadOpinions() {
    try {
      const response = await fetch('./party_opinion.json');
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
