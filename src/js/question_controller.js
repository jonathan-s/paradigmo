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
    await this.loadJSON()
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

  next() {
    this.setQuestion(this.currentQuestion + 1)
  }

  previous() {
    this.setQuestion(this.currentQuestion - 1)
  }

  answer(event) {
    this.userAnswers[this.currentQuestion] = parseInt(event.target.value)
    this.next()
  }

  async loadJSON() {
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

}


window.Stimulus = Application.start()
Stimulus.register("question", QuestionController)

console.log("hello world")
