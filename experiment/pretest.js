/////////////////////////////////////////////////////////////////////////////

/////////////////////// Do not modify the below code ////////////////////////

/////////////////////////////////////////////////////////////////////////////

(function() {
  function buildQuiz() {
    // we'll need a place to store the HTML output
    const output = [];

    // for each question...
    myQuestions.forEach((currentQuestion, questionNumber) => {
      // we'll want to store the list of answer choices
      const answers = [];

      // and for each available answer...
      for (letter in currentQuestion.answers) {
        // ...add an HTML radio button
        answers.push(
          `<label>
            <input type="radio" name="question${questionNumber}" value="${letter}">
            ${letter} :
            ${currentQuestion.answers[letter]}
          </label>`
        );
      }

      // add this question and its answers to the output
      output.push(
        `<div class="question"> ${currentQuestion.question} </div>
        <div class="answers"> ${answers.join("")} </div>`
      );
    });

    // finally combine our output list into one string of HTML and put it on the page
    quizContainer.innerHTML = output.join("");
  }

  function showResults() {
    // gather answer containers from our quiz
    const answerContainers = quizContainer.querySelectorAll(".answers");

    // keep track of user's answers
    let numCorrect = 0;

    // for each question...
    myQuestions.forEach((currentQuestion, questionNumber) => {
      // find selected answer
      const answerContainer = answerContainers[questionNumber];
      const selector = `input[name=question${questionNumber}]:checked`;
      const userAnswer = (answerContainer.querySelector(selector) || {}).value;

      // if answer is correct
      if (userAnswer === currentQuestion.correctAnswer) {
        // add to the number of correct answers
        numCorrect++;

        // color the answers green
        //answerContainers[questionNumber].style.color = "lightgreen";
      } else {
        // if answer is wrong or blank
        // color the answers red
        answerContainers[questionNumber].style.color = "red";
      }
    });

    // show number of correct answers out of total
    resultsContainer.innerHTML = `${numCorrect} out of ${myQuestions.length}`;
  }

  const quizContainer = document.getElementById("quiz");
  const resultsContainer = document.getElementById("results");
  const submitButton = document.getElementById("submit");
 

/////////////////////////////////////////////////////////////////////////////

/////////////////////// Do not modify the above code ////////////////////////

/////////////////////////////////////////////////////////////////////////////






/////////////// Write the MCQ below in the exactly same described format ///////////////

const myQuestions = [
  {
    question: "What is the main function of a centrifugal pump?",
    answers: {
      a: "To compress gases",
      b: "To convert pressure energy into kinetic energy",
      c: "To convert mechanical energy into hydraulic energy",
      d: "To measure the flow of fluid"
    },
    correctAnswer: "c"
  },
  {
    question: "Which part of the centrifugal pump imparts energy to the fluid?",
    answers: {
      a: "Casing",
      b: "Impeller",
      c: "Delivery pipe",
      d: "Suction pipe"
    },
    correctAnswer: "b"
  },
  {
    question: "Why is priming necessary before starting a centrifugal pump?",
    answers: {
      a: "To start the motor",
      b: "To clean the impeller",
      c: "To fill the pump with water and remove air",
      d: "To increase the pressure in the suction pipe"
    },
    correctAnswer: "c"
  },
  {
    question: "The efficiency of a centrifugal pump is calculated as:",
    answers: {
      a: "Output power divided by input power",
      b: "Head divided by discharge",
      c: "Discharge divided by head",
      d: "Input power divided by output power"
    },
    correctAnswer: "a"
  },
  {
    question: "What happens to the fluid when it passes through the rotating impeller?",
    answers: {
      a: "Its temperature decreases",
      b: "It moves to the suction pipe",
      c: "Its velocity and pressure increase",
      d: "It gets compressed"
    },
    correctAnswer: "c"
  }
];


/////////////////////////////////////////////////////////////////////////////

/////////////////////// Do not modify the below code ////////////////////////

/////////////////////////////////////////////////////////////////////////////


  // display quiz right away
  buildQuiz();

  // on submit, show results
  submitButton.addEventListener("click", showResults);
})();


/////////////////////////////////////////////////////////////////////////////

/////////////////////// Do not modify the above code ////////////////////////

/////////////////////////////////////////////////////////////////////////////
