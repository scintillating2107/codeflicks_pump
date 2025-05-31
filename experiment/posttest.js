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
    question: "What happens to the manometric head when the discharge of a centrifugal pump increases?",
    answers: {
      a: "It increases",
      b: "It decreases",
      c: "It remains constant",
      d: "It becomes zero"
    },
    correctAnswer: "b"
  },
  {
    question: "Which factor primarily affects the efficiency of a centrifugal pump?",
    answers: {
      a: "Suction pressure only",
      b: "Discharge and head developed",
      c: "Material of the impeller",
      d: "Color of the pump casing"
    },
    correctAnswer: "b"
  },
  {
    question: "If the input power to the pump is 2 kW and the output power is 1.5 kW, what is the efficiency?",
    answers: {
      a: "75%",
      b: "133%",
      c: "3.5%",
      d: "0.75%"
    },
    correctAnswer: "a"
  },
  {
    question: "Which of the following is NOT a part of the centrifugal pump?",
    answers: {
      a: "Impeller",
      b: "Volute casing",
      c: "Piston",
      d: "Shaft"
    },
    correctAnswer: "c"
  },
  {
    question: "What is the main reason for efficiency loss in a centrifugal pump?",
    answers: {
      a: "Friction and hydraulic losses",
      b: "Motor color",
      c: "Shape of the delivery pipe",
      d: "Type of valve used"
    },
    correctAnswer: "a"
  },
  {
    question: "On increasing the radius of the steel ball to double its value, the terminal velocity of the ball becomes:",
    answers: {
      a: "Double",
      b: "Four times",
      c: "Eight times",
      d: "Sixteen times"
    },
    correctAnswer: "b"
  },
  {
    question: "On increasing the density of material of the falling ball, its terminal velocity:",
    answers: {
      a: "Increases",
      b: "Decreases",
      c: "Remains constant",
      d: "Not affected"
    },
    correctAnswer: "a"
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
