import { Application, Controller } from "./stimulus.js";

/**
 * Generates mock user answers for testing political compass calculations
 * @param {number} count - Number of answers to generate (default: 60)
 * @returns {Object} Object with question indices as keys and mock answer objects as values
 */
function mockAnswers(count = 60) {
  const types = ["social", "económico", "politicá"];
  const mockAnswers = {};

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const multiplier = Math.random() < 0.5 ? -1 : 1;

    // Generate answer values between -2 and 2
    // -2, -1, 0, 1, or 2
    const answerValue = Math.floor(Math.random() * 5) - 2;

    mockAnswers[i] = {
      answer: answerValue,
      index: i,
      multiplier: multiplier,
      type: type
    };
  }

  return mockAnswers;
}

/**
 * Calculate political party affinity scores based on question answers.
 *
 * @param {Object} userAnswers - Dictionary with question_id as key and user's answer (numeric) as value
 * @param {Object} partyAnswers - Dictionary where keys are party names and values are dictionaries of {question_id: answer}
 * @param {Array} questionIds - Optional list of question IDs to consider. If null, uses all keys in userAnswers
 * @param {number} maxDiffPerQuestion - Maximum possible difference between answers for a single question
 * @returns {Object} Dictionary of party names and their affinity scores (0-1 scale), sorted by descending affinity
 */
function calculatePartyAffinity(userAnswers, partyAnswers, questionIds = null, maxDiffPerQuestion = 4) {
  // Use provided questionIds or all keys from userAnswers
  questionIds = questionIds || Object.keys(userAnswers);

  // Filter to only include questions the user answered
  const answeredQuestions = questionIds.filter(qId => qId in userAnswers);
  const numAnswered = answeredQuestions.length;

  if (numAnswered === 0) {
    return {};  // No answers to evaluate
  }

  // Calculate distance between user answers and each party's answers
  const distances = {};
  for (const [partyName, partyPositions] of Object.entries(partyAnswers)) {
    let totalDifference = 0;
    for (const questionId of answeredQuestions) {
      if (questionId in partyPositions) {
        const difference = Math.abs(userAnswers[questionId] - partyPositions[questionId]);
        totalDifference += difference;
      }
    }
    distances[partyName] = totalDifference;
  }

  // Calculate maximum possible distance
  const maxPossibleDistance = maxDiffPerQuestion * numAnswered;

  // Convert distances to affinity scores (0-1 scale)
  const affinityScores = {};
  for (const [party, distance] of Object.entries(distances)) {
    affinityScores[party] = Math.max(0.0, Math.min(1.0, 1 - (distance / maxPossibleDistance)));
  }

  // Sort by descending affinity score
  const sortedEntries = Object.entries(affinityScores).sort((a, b) => b[1] - a[1]);
  const sortedScores = Object.fromEntries(sortedEntries);

  return sortedScores;
}

/**
 * Convert coordinates from (-1, 1) range to CSS position.
 *
 * @param {number} x - X coordinate in (-1, 1) range
 * @param {number} y - Y coordinate in (-1, 1) range
 * @returns {Object} Object with 'left' and 'top' as percentage strings
 *
 * Coordinate system:
 * (-1, 1) is top-left
 * (1, 1) is top-right
 * (-1, -1) is bottom-left
 * (1, -1) is bottom-right
 */
function tupleToCssPosition(x, y) {
  // Map x from (-1, 1) to (0%, 100%)
  const leftPercent = ((x + 1) / 2) * 100;

  // Map y from (1, -1) to (0%, 100%)
  // Note: We invert y because in CSS, top: 0% is the top of the container
  // and top: 100% is the bottom, while in our coordinate system,
  // y=1 is top and y=-1 is bottom
  const topPercent = ((1 - y) / 2) * 100;

  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`
  };
}

/**
 * Calculates Economic, Social, and Political scores (-1 to 1) using multipliers.
 * @param {Array} questions - Array of question objects with properties type, multiplier, and answer
 * @returns {Object} Object containing economic, social, and political scores
 */
function calculateCompassScores(questions) {
  const scores = { economic: 0.0, social: 0.0, political: 0.0 };

  // Filter questions by type
  const socialQuestions = questions.filter(q => q.type === "social");
  const economicQuestions = questions.filter(q => q.type === "económico");
  const politicalQuestions = questions.filter(q => q.type === "politicá");

  const axisDefinitions = {
    economic: economicQuestions,
    social: socialQuestions,
    political: politicalQuestions
  };

  // Calculate scores for each axis
  for (const [axisName, axisQuestions] of Object.entries(axisDefinitions)) {
    // Extract answers and multipliers for this axis
    const validAnswers = axisQuestions.map(q => q.answer);
    const relevantMultipliers = axisQuestions.map(q => q.multiplier);

    const numAnswered = validAnswers.length;

    // Skip if no questions answered for this category
    if (numAnswered === 0) continue;

    // Calculate weighted sum
    const weightedScoreSum = validAnswers.reduce((sum, answer, index) => {
      return sum + (answer * relevantMultipliers[index]);
    }, 0);

    // Normalize score between -1 and 1
    const normalizedScore = weightedScoreSum / (numAnswered * 2.0);
    scores[axisName] = Math.max(-1.0, Math.min(1.0, normalizedScore));
  }

  return { ...scores, ...tupleToCssPosition(scores.economic, scores.social) };
}

const createCircle = (percent) => {
  let circumference = 2* Math.PI * 80 // is a set value in svg
  let offset = (1 - percent) * circumference
  let number = Math.round(percent * 100, 0)

  let svg = document.querySelector("#circle").innerHTML
  svg = svg.replace("${offset}", offset)
  svg = svg.replace("${number}", number + "%")
  console.log(svg)
  return svg
}

const createChart = (parties) => {
  let dots = ``

  for (let p of parties) {
    console.log(p)
    dots = dots + `<div alt="${p.fullname}" class="party ${p.key}" style="left: ${p.left}; top: ${p.top}"></div>`
  }
  let html = `
    <div class="text-s top-label">Progressista</div>
    <div class="text-s bottom-label">Conservador</div>
    <div class="text-s left-label">Esquerda</div>
    <div class="text-s right-label">Direita</div>

    <div class="main-horizontal dotted-spaced"></div>
    <div class="main-vertical left dotted-spaced"></div>

    <div class="relative compass-container">
      ${dots}
    </div>
  `

  return html
}

const createPartyTable = (affinities, parties) => {
  let html = ""

  for (let [party, affinity] of affinities) {
    console.log(party, affinity)
    let percent = Math.round(100 * affinity, 0)
    let rest = 100 - percent
    let row = `
      <div class="party-row">
        <img src="../images/logos/${parties[party].key}.png" alt="${parties[party].fullname}" \>
        <div class="party-bar-container" style="flex-grow: ${percent}">
            <div class="party-name">${parties[party].fullname}</div>
        </div>
        <div style="flex-grow: ${rest}"></div>
        <div class="party-percentage">${percent}%</div>
      </div>
    `
    html = html + row
  }
  return html
}


const createParty = (party, percent) => {
  let svg = createCircle(percent)
  let data = `
      <div id="party-box" class="content-box party-box">
        <div class="party-card">
            <div class="left-column">
                <div>
                    <div class="logo-placeholder mb-5">
                      <img class="logo" src="./images/logos/${party.key}.png">
                    </div>
                    <h3>${party.fullname}</h3>
                    <div class="text-secondary text-ss italic">${party.leaning}</div>
                </div>
                <p class="party-description text-ss mt-2">${party.blurb}</p>
            </div>
            <div class="right-column">
              ${svg}
            </div>
        </div>
    </div>
  `
  return data
}

const questionContent = `


`

class ScrollController extends Controller {
  toQuestion() {
    this.scrollTo(".question-box", 100)
  }

  scrollTo(selector, offset) {
    var element = document.querySelector(selector);
    var headerOffset = 45;
    var elementPosition = element.getBoundingClientRect().top;
    var offsetPosition = elementPosition - offset;

    window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
    });
  }
}


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
    await this.loadPartyAnswers()
  }

  connect() {
    this.currentQuestion = 0
    this.userAnswers = {}
  }

  init(event) {
    // Test the last questions.
    this.userAnswers = mockAnswers(60)
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
    let score = calculateCompassScores(Object.values(this.userAnswers))
    console.log(score)

    let answers = {}
    for (let q of Object.values(this.userAnswers)) {
      answers[q.index] = q.answer
    }
    console.log(answers)
    let userAffinities = calculatePartyAffinity(answers, this.partyAnswers)

    console.log("Result affinity")
    console.log(userAffinities)

    this.resultTarget.classList.remove("hidden")
    this.resultTarget.classList.remove("invisible")
    document.querySelector("#chart").innerHTML = createChart(Object.values(this.parties))

    let affinities = Object.entries(userAffinities)
    let [party, percent] = affinities[0]
    let data = createParty(this.parties[party], percent)
    document.querySelector("#party-table").innerHTML = createPartyTable(affinities, this.parties)
    this.resultTarget.querySelector("#party-box").outerHTML = data
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
      index: this.questions[this.currentQuestion].index,
      multiplier: this.questions[this.currentQuestion].multiplier,
      type: this.questions[this.currentQuestion].type
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

  async loadPartyAnswers() {
    try {
      const response = await fetch('./party_answers.json');
      const data = await response.json();
      this.partyAnswers = data
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  }

}


window.Stimulus = Application.start()
Stimulus.register("question", QuestionController)
Stimulus.register("scroll", ScrollController)

console.log("hello world")
