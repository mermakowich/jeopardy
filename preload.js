// const { dialog } = require('electron')
const XLSX = require('xlsx');
const domain = require("domain");


window.addEventListener('DOMContentLoaded', () => {
    let questions = []
    let answers = []
    let players = { "Денис": 0, "Игорь": 0, "Максим": 0 }
    let currentRow = 0
    let currentCost = 0
    let timer = null

    let tabs = document.querySelectorAll("section")
    let questionDiv = document.querySelector(".question")
    let startGameMenuButton = document.querySelector("#start-game-menu-button")
    let startFaqScreenButton = document.querySelector("#start-faq-screen-button")
    let startGameButton = document.querySelector("#start-new-game-button")
    let timerSeconds = 30
    let questionTimer = document.querySelector(".time-status")

    // dialog.showOpenDialog()

    // временные обработчики кнопок 1-5 для переключения между экранами и 6 для тестирования
    document.addEventListener("keypress", (e) => {
        if (e.key == "1") {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[0].classList.add("show")
        }
        if (e.key == "2") {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[1].classList.add("show")
        }
        if (e.key == "3") {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[2].classList.add("show")
        }
        if (e.key == "4") {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[3].classList.add("show")
        }
        if (e.key == "5") {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[4].classList.add("show")
        }
        if (e.key == "6") {
            updatePlayersFrame(players)
        }
    })

    startGameMenuButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[1].classList.add("show")
    })

    startFaqScreenButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[4].classList.add("show")
    })

    let sliderPages = document.querySelector(".slider-pages")
    let prevButton = document.querySelector(".slider-prev-button")
    let nextButton = document.querySelector(".slider-next-button")
    let addPlayerButton = document.querySelector(".input-user-button")
    //let slider = document.querySelector(".faq-slider")
    let sliders = document.querySelectorAll(".faq-item")
    let currentSliderNumber = 0
    sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`

    addPlayerButton.addEventListener("click", (e) => {
        e.preventDefault()
        if (document.querySelector("#input-user-field").value.trim() !== "" &&
            !(document.querySelector("#input-user-field").value in players)) {
            let userItemTemplate = document.querySelector("#user-item-template").content
            let clonedUserItem = userItemTemplate.cloneNode(true)
            clonedUserItem.querySelector('span').textContent = document.querySelector("#input-user-field").value
            players[document.querySelector("#input-user-field").value] = 0
            document.querySelector("#input-user-field").value = ""
            clonedUserItem.querySelector('.delete-user-button').addEventListener("click", (e) => {
                e.preventDefault()
                if ("user-item" === e.target.parentElement.classList.value) {
                    e.target.parentElement.remove()
                    delete players[e.target.parentElement.children[0].textContent]
                } else {
                    e.target.parentElement.parentElement.remove()
                    delete players[e.target.parentElement.parentElement.children[0].textContent]
                }
            })
            document.querySelector(".users-list").appendChild(clonedUserItem)
        } else {
            document.querySelector("#input-user-field").value = ""
        }
    })

    prevButton.addEventListener("click", (e) => {
        e.preventDefault()
        currentSliderNumber--
        if (currentSliderNumber == -1) {
            currentSliderNumber = 0
        } else {
            let currentSlide = document.querySelector(".item-show")
            sliders[currentSliderNumber].classList.add("item-show")
            sliders[currentSliderNumber].classList.add("left-slide")
            currentSlide.classList.remove("item-show")
            currentSlide.classList.remove("left-slide")
            currentSlide.classList.remove("right-slide")
            sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`
        }
    })

    nextButton.addEventListener("click", (e) => {
        e.preventDefault()
        currentSliderNumber++
        if (currentSliderNumber == sliders.length) {
            currentSliderNumber = sliders.length - 1
        } else {
            let currentSlide = document.querySelector(".item-show")
            sliders[currentSliderNumber].classList.add("item-show")
            sliders[currentSliderNumber].classList.add("right-slide")
            currentSlide.classList.remove("item-show")
            currentSlide.classList.remove("left-slide")
            currentSlide.classList.remove("right-slide")
            sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`
        }
    })

    document.addEventListener("keydown", (e) => {
        if (tabs[4].classList.contains("show")) {
            if (e.code == "ArrowLeft") {
                e.preventDefault()
                currentSliderNumber--
                if (currentSliderNumber == -1) {
                    currentSliderNumber = 0
                } else {
                    let currentSlide = document.querySelector(".item-show")
                    sliders[currentSliderNumber].classList.add("item-show")
                    sliders[currentSliderNumber].classList.add("left-slide")
                    currentSlide.classList.remove("item-show")
                    currentSlide.classList.remove("left-slide")
                    currentSlide.classList.remove("right-slide")
                    sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`
                }
            } else if (e.code == "ArrowRight") {
                e.preventDefault()
                currentSliderNumber++
                if (currentSliderNumber == sliders.length) {
                    currentSliderNumber = sliders.length - 1
                } else {
                    let currentSlide = document.querySelector(".item-show")
                    sliders[currentSliderNumber].classList.add("item-show")
                    sliders[currentSliderNumber].classList.add("right-slide")
                    currentSlide.classList.remove("item-show")
                    currentSlide.classList.remove("left-slide")
                    currentSlide.classList.remove("right-slide")
                    sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`
                }
            }
        }

    })

    startGameButton.addEventListener("click", (e) => {
        e.preventDefault()
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[2].classList.add("show")

        let field = document.querySelector('.game')

        for (let i = 0; i < questions.length; i++) {
            let rowTemplate = document.querySelector('#row-template').content
            let themeTemplate = document.querySelector('#theme-template').content
            let theme = themeTemplate.querySelector('div')
            let row = rowTemplate.querySelector('div')
            let clonedTheme = theme.cloneNode(true)
            let clonedRow = row.cloneNode(true)
            clonedTheme.children[0].textContent = questions[i]["THEME"]
            clonedRow.appendChild(clonedTheme)
            for (let j = 0; j < 5; j++) {
                let buttonTemplate = document.querySelector('#button-template').content.querySelector('button')
                let clonedButton = buttonTemplate.cloneNode(true)
                clonedButton.textContent = (j + 1) * 100
                clonedButton.dataset.row = i
                clonedButton.addEventListener('click', (event) => {

                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btn.disabled = false
                        })
                    }

                    currentRow = event.target.dataset.row
                    currentCost = (j + 1) * 100
                    document.querySelector(".question-text").textContent = questions[event.target.dataset.row][event.target.textContent]
                    questionTimer.style = `width: 0px`
                    let start = Date.now()
                    let round_element = document.createElement("div")
                    round_element.style = `display: inline-block; position:absolute; width:1px; 
                                    height: 1px; z-index:12; background: rgb(12, 20, 53); 
                                    box-shadow: 0 0 20px 120px rgb(12, 20, 53);
                                    border-radius: 50%; top: ${event.clientY}px; left:${event.clientX}px`
                    questionDiv.style = `opacity: 0`
                    tabs[2].appendChild(round_element)
                    let timer = setInterval(function () {
                        let timePassed = Date.now() - start
                        if (timePassed <= 300) {
                            showCircle(timePassed)
                        } else if (timePassed <= 600) {
                            tabs.forEach((tab) => {
                                tab.classList.remove("show")
                            })
                            tabs[3].classList.add("show")

                            showQuestion(timePassed)

                        } else if (timePassed > 600) {
                            clearInterval(timer)
                            round_element.style = ""
                            clonedButton.disabled = true
                            let event = new Event("timer-tick")

                            document.dispatchEvent(event)
                            return
                        }
                    }, 1)

                    function showQuestion(timePassed) {
                        questionDiv.style = `opacity: ${(timePassed - 300) / 300}`
                    }

                    function showCircle(timePassed) {
                        round_element.style = `display: inline-block; position:absolute; 
                                    width:${timePassed * 8}px; 
                                    height: ${timePassed * 8}px;
                                    overflow: hidden;
                                     z-index:12; background: rgb(12, 20, 53); 
                                    box-shadow: 0 0 40px 70px rgb(12, 20, 53);
                                    border-radius: 50%; top: ${event.clientY - timePassed * 4}px; left:${event.clientX - timePassed * 4}px`
                        tabs[2].appendChild(round_element)
                    }
                })
                clonedRow.appendChild(clonedButton)
            }
            field.insertBefore(clonedRow, field.children[0]);
        }
        let playersFrame = document.querySelector('.players-frame')
        for (let [key, value] of Object.entries(players)) {
            let playerCardTemplate = document.querySelector('#player-card-template').content
            let playerCard = playerCardTemplate.querySelector('div')
            let clonedPlayerCard = playerCard.cloneNode(true)
            clonedPlayerCard.querySelector('.player-name').textContent = key
            clonedPlayerCard.querySelector('.player-score').textContent = value

            playersFrame.appendChild(clonedPlayerCard)
        }
        let playersGameFrame = document.querySelector('.players-game-frame')
        for (let key of Object.keys(players)) {
            let playerQuestionCardTemplate = document.querySelector('#player-question-card-template').content
            let playerQuestionCard = playerQuestionCardTemplate.querySelector('div')
            let clonedPlayerQuestionCard = playerQuestionCard.cloneNode(true)
            clonedPlayerQuestionCard.querySelector('.player-name').textContent = key
            clonedPlayerQuestionCard.querySelector('.ok-answer').addEventListener('click', (e) => {
                players[key] += currentCost
                document.querySelector(".question-text").innerHTML = answers[currentRow][currentCost]
                for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                    playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                        btn.disabled = true
                    })
                }
                for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                    playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                }
            })
            clonedPlayerQuestionCard.querySelector('.wrong-answer').addEventListener('click', (e) => {
                players[key] -= currentCost
                clonedPlayerQuestionCard.querySelector('.ok-answer').disabled = true
                clonedPlayerQuestionCard.querySelector('.wrong-answer').disabled = true
            })

            playersGameFrame.appendChild(clonedPlayerQuestionCard)
        }
    })

    // Удалить код ниже, он для дебага

    let file = 'test.xlsx'
    document.querySelector('.input-file-text').textContent = file

    const reader = XLSX.readFile(file)


    const questions_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[0]]).reverse()
    questions_temp.forEach((res) => {
        questions.push(res)
    })

    const answers_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[1]]).reverse()
    answers_temp.forEach((res) => {
        answers.push(res)
    })
    startGameButton.click()

    // Получение файла нормально, закомменчено для дебага

    // document.querySelector('.input-file input[type=file]').addEventListener('change', function (e) {
    //     let file = this.files[0]
    //     document.querySelector('.input-file-text').textContent = file.name

    //     const reader = XLSX.readFile(file.path)


    //     const questions_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[0]]).reverse()
    //     questions_temp.forEach((res) => {
    //         questions.push(res)
    //     })

    //     const answers_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[1]]).reverse()
    //     answers_temp.forEach((res) => {
    //         answers.push(res)
    //     })
    // });

    let inputRangeField = document.querySelector(".input-range-field")
    inputRangeField.addEventListener("input", (e) => {
        let inputRangeValue = document.querySelector('.input-range-value')
        inputRangeValue.textContent = `${e.target.value} СЕК.`
    })


    let newGameFormSidebar = document.querySelector(".new-game-sidebar")
    let loadGameFormSidebar = document.querySelector(".load-game-sidebar")
    let newGameElements = document.querySelectorAll(".new-game-sidebar input, .new-game-sidebar button")
    let loadGameElements = document.querySelectorAll(".load-game-sidebar input, .load-game-sidebar button")
    newGameFormSidebar.addEventListener("click", (e) => {
        loadGameElements.forEach((el) => el.disabled = true)
        if (!e.target.classList.contains("active-sidebar") && e.target.classList.contains("menu-sidebar")) {
            loadGameFormSidebar.classList.remove("active-sidebar")
            e.target.classList.add("active-sidebar")
            newGameElements.forEach((el) => el.disabled = false)
        }
    })
    loadGameElements.forEach((el) => el.disabled = true)
    loadGameFormSidebar.addEventListener("click", (e) => {
        newGameElements.forEach((el) => el.disabled = true)
        if (!e.target.classList.contains("active-sidebar") && e.target.classList.contains("menu-sidebar")) {
            newGameFormSidebar.classList.remove("active-sidebar")
            e.target.classList.add("active-sidebar")
            loadGameElements.forEach((el) => el.disabled = false)
        }
    })

    document.addEventListener("timer-tick", (e) => {


        let width = questionTimer.parentNode.offsetWidth
        let start = Date.now()
        let tick = width / (timerSeconds * 1000)
        timer = setInterval(() => {
            let timePassed = Date.now() - start
            if (timePassed <= timerSeconds * 1000) {
                questionTimer.style = `width: ${tick * timePassed}px`
            } else {
                clearInterval(timer)
            }
        }, 1)
    })
})