// const { dialog } = require('electron')
const XLSX = require('xlsx')
const sqlite3 = require('sqlite3').verbose()
const domain = require("domain")
const fs = require('fs')
const path = require('path')

window.addEventListener('DOMContentLoaded', () => {

    const fillSaveGame = async () => {
        let games = JSON.parse(fs.readFileSync('games.json'))
        document.querySelector('.save-game-list').innerHTML = ''
        for (let [i, name] of Object.keys(games).entries()) {
            let saveGameItemTemplate = document.querySelector('#save-game-item-template').content
            let saveGameItem = saveGameItemTemplate.querySelector('li')
            let clonedSaveGameItem = saveGameItem.cloneNode(true)
            let clonedInput = clonedSaveGameItem.querySelector('input')
            clonedInput.value = name
            clonedSaveGameItem.querySelector('.save-game-label').innerHTML += `${name} (${games[name]['gameDate']})`
            clonedSaveGameItem.querySelector('.delete-save-game-button').addEventListener("click", (e) => {
                e.preventDefault()
                if ("save-game-radio" === e.target.parentElement.classList.value) {
                    // e.target.parentElement.parentElement.remove()
                    gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                    console.log(e.target.parentElement.innerHTML)
                    // delete gamesData[e.target.parentElement.innerHTML]
                    fs.writeFileSync('games.json', JSON.stringify(gamesData))
                } else {
                    // e.target.parentElement.parentElement.remove()
                    // delete players[e.target.parentElement.parentElement.children[0].textContent]
                }
            })
            document.querySelector('.save-game-list').appendChild(clonedSaveGameItem)
        }
    }

    document.addEventListener("timer-tick", (e) => {
        let width = questionTimer.parentNode.offsetWidth
        start = Date.now()
        let tick = width / (timerSeconds * 1000)
        timer = setInterval(() => {
            timePassed = Date.now() - start + pauseTime
            if (timePassed <= timerSeconds * 1000) {
                questionTimer.style = `width: ${tick * timePassed}px`
            } else {
                stopQuestionTimer()
                backToFieldButton.style.visibility = 'visible'
                for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                    playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                        btn.disabled = true
                    })
                }
                let answerText = answers[currentRow][currentCost]
                if (!filesExtensions.includes(answerText.split(".")[answerText.split(".").length - 1])) {
                    document.querySelector(".question-text").textContent = answerText
                } else {
                    let img = document.createElement('img')
                    img.classList.add("question-image")
                    img.src = xlsxPath + '/../files/' + answerText
                    document.querySelector(".question-text").textContent = ""
                    document.querySelector(".question-text").appendChild(img)
                }
                gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                gamesData[gameName]['players'] = players
                fs.writeFileSync('games.json', JSON.stringify(gamesData))
            }
        }, 1)
    })

    const startQuestionTimer = async (event, onlyTimer = false, pause = false) => {
        let round_element = document.createElement("div")
        if (!onlyTimer) {
            questionTimer.style = `width: 0px`
            start = Date.now()
            round_element.style = `display: inline-block; position:absolute; width:1px; 
                                    height: 1px; z-index:12; background: rgb(12, 20, 53); 
                                    box-shadow: 0 0 20px 120px rgb(12, 20, 53);
                                    border-radius: 50%; top: ${event.clientY}px; left:${event.clientX}px`
            questionDiv.style = `opacity: 0`
            tabs[2].appendChild(round_element)
        }
        if (pause) {
            pauseTime = timePassed
            clearInterval(timer)
        } else {
            circleTimer = setInterval(function () {
                timePassed = Date.now() - start + pauseTime
                if (timePassed <= 300) {
                    showCircle(timePassed)
                } else if (timePassed <= 600) {
                    tabs.forEach((tab) => {
                        tab.classList.remove("show")
                    })
                    tabs[3].classList.add("show")

                    showQuestion(timePassed)

                } else if (timePassed > 600) {
                    clearInterval(circleTimer)
                    round_element.style = ""
                    if (event) {
                        event.target.disabled = true
                    }
                    eventTimer = new Event("timer-tick")

                    document.dispatchEvent(eventTimer)
                    return
                }

            }, 1)
        }

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

    }

    const stopQuestionTimer = async () => {
        clearInterval(timer)
        pauseTime = 0
    }

    let questions = []
    let answers = []
    let xlsxFile = ''
    let players = {}
    let currentRow = 0
    let currentCost = 0
    let eventTimer = null
    let timer = null
    let circleTimer = null
    let timerFlag = false
    let timePassed = 0
    let startTime = null
    let pauseTime = null
    let gameName = ''
    let filesExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg', 'raw', 'psd',]
    let gameBoard =
        [[0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],]

    let tabs = document.querySelectorAll("section")
    let questionDiv = document.querySelector(".question")
    let startGameMenuButton = document.querySelector("#start-game-menu-button")
    let startFaqScreenButton = document.querySelector("#start-faq-screen-button")
    let startGameButton = document.querySelector("#start-new-game-button")
    let continueGameButton = document.querySelector("#load-game-button")
    let backToFieldButton = document.querySelector("#back-to-field")
    let questionTimer = document.querySelector(".time-status")
    let inputRangeField = document.querySelector(".input-range-field")
    let sliderPages = document.querySelector(".slider-pages")
    let prevButton = document.querySelector(".slider-prev-button")
    let nextButton = document.querySelector(".slider-next-button")
    let addPlayerButton = document.querySelector(".input-user-button")
    let sliders = document.querySelectorAll(".faq-item")
    let newGameFormSidebar = document.querySelector(".new-game-sidebar")
    let loadGameFormSidebar = document.querySelector(".load-game-sidebar")
    let newGameElements = document.querySelectorAll(".new-game-sidebar input, .new-game-sidebar button")
    let loadGameElements = document.querySelectorAll(".load-game-sidebar input, .load-game-sidebar button")
    let faqBackButton = document.querySelector("#faq-back-button")
    let faqStartGameButton = document.querySelector("#faq-start-game-button")
    let closeButton = document.querySelector("#close-button")

    let timerSeconds = 10
    let currentSliderNumber = 0
    sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`


    fs.access("games.json", (e) => {
        if (e) {
            console.log("games.json exists")
            fs.writeFileSync("games.json", JSON.stringify({}))
        }
    });

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
    })

    document.addEventListener("keydown", (e) => {
        let section_index = 0
        let new_section = 0
        let sections = document.querySelectorAll("section")
        for (let i = 0; i < sections.length; i++) {
            if ("show" == sections[i].className.toLowerCase()) {
                section_index = i
            }
        }
        console.log(e.key)
        switch (e.key) {
            case "Escape":
                switch (section_index) {
                    case 0:
                        new_section = 0
                        break
                    case 1:
                        new_section = 0
                        break
                    case 2:
                        new_section = 1
                        closeButton.style = ''
                        document.querySelector('.game').innerHTML = '<div class="players-frame"></div>'
                        questions = []
                        answers = []
                        xlsxFile = ''
                        players = {}
                        gameName = ''
                        gameBoard =
                            [[0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],]
                        fillSaveGame()
                        document.querySelector('.players-game-frame').innerHTML = ''
                        break
                    case 3:
                        new_section = 2
                        stopQuestionTimer()
                        break
                    case 4:
                        new_section = 0
                        break
                    case 5:
                        new_section = 0
                        break
                    default:
                        new_section = 0
                }
                tabs.forEach((tab) => {
                    2
                    tab.classList.remove("show")
                })
                tabs[new_section].classList.add("show")
            case " ":
                switch (section_index) {
                    case 3:
                        if (timerFlag) {
                            startQuestionTimer(null, true, false)
                        } else {
                            startQuestionTimer(null, true, true)
                        }
                        timerFlag = !timerFlag
                        break
                    default:
                        break
                }
        }
    })

    closeButton.addEventListener("click", (e) => {
        window.close()
    })

    startGameMenuButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[1].classList.add("show")

        fillSaveGame()
    })

    startFaqScreenButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[4].classList.add("show")
    })

    faqBackButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[0].classList.add("show")
    })

    faqStartGameButton.addEventListener("click", (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[1].classList.add("show")

        fillSaveGame()
    })

    continueGameButton.addEventListener("click", (e) => {
        e.preventDefault()

        let checkedGame = false

        document.querySelectorAll("[name=save-game]").forEach((e) => {
            if (e.checked) {
                gameName = e.value
                gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))[gameName]
                checkedGame = true
            }
        })

        if (checkedGame) {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[2].classList.add("show")

            players = gamesData['players']
            gameBoard = gamesData['gameBoard']
            xlsxPath = gamesData['xlsxPath']

            timerSeconds = gamesData['timer']

            const reader = XLSX.readFile(xlsxPath)

            const questions_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[0]]).reverse()
            questions_temp.forEach((res) => {
                questions.push(res)
            })

            const answers_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[1]]).reverse()
            answers_temp.forEach((res) => {
                answers.push(res)
            })

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
                    if (gameBoard[questions.length - i - 1][j] == 1) {
                        clonedButton.disabled = true
                    }
                    clonedButton.addEventListener('click', (event) => {

                        for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                            playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                                btn.disabled = false
                            })
                        }
                        backToFieldButton.style.visibility = 'hidden'

                        currentRow = event.target.dataset.row
                        currentCost = (j + 1) * 100
                        gameBoard[questions.length - i - 1][j] = 1


                        gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                        gamesData[gameName]['gameBoard'] = gameBoard
                        fs.writeFileSync('games.json', JSON.stringify(gamesData))

                        let questionText = questions[event.target.dataset.row][event.target.textContent]
                        if (!filesExtensions.includes(questionText.split(".")[questionText.split(".").length - 1])) {
                            document.querySelector(".question-text").textContent = questionText
                        } else {
                            let img = document.createElement('img')
                            img.classList.add("question-image")
                            img.src = xlsxPath + '/../files/' + questionText
                            document.querySelector(".question-text").textContent = ""
                            document.querySelector(".question-text").appendChild(img)
                        }
                        startQuestionTimer(event, false, false)
                    })
                    clonedRow.appendChild(clonedButton)
                }
                field.insertBefore(clonedRow, field.children[0])
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
                    let answerText = answers[currentRow][currentCost]
                    if (!filesExtensions.includes(answerText.split(".")[answerText.split(".").length - 1])) {
                        document.querySelector(".question-text").textContent = answerText
                    } else {
                        console.log(xlsxFile.path)
                        let img = document.createElement('img')
                        img.classList.add("question-image")
                        img.src = xlsxPath + '/../files/' + answerText
                        document.querySelector(".question-text").textContent = ""
                        document.querySelector(".question-text").appendChild(img)
                    }

                    gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                    gamesData[gameName]['players'] = players
                    fs.writeFileSync('games.json', JSON.stringify(gamesData))

                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btn.disabled = true
                        })
                    }
                    for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                        playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                    }
                    stopQuestionTimer()
                    backToFieldButton.style.visibility = 'visible'
                })
                clonedPlayerQuestionCard.querySelector('.wrong-answer').addEventListener('click', (e) => {
                    players[key] -= currentCost
                    clonedPlayerQuestionCard.querySelector('.ok-answer').disabled = true
                    clonedPlayerQuestionCard.querySelector('.wrong-answer').disabled = true
                    let btns = []
                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btns.push(btn.disabled)
                        })
                    }
                    if (btns.every((e) => { return e })) {
                        stopQuestionTimer()
                        backToFieldButton.style.visibility = 'visible'
                        for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                            playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                                btn.disabled = true
                            })
                        }
                        let answerText = answers[currentRow][currentCost]
                        if (!filesExtensions.includes(answerText.split(".")[answerText.split(".").length - 1])) {
                            document.querySelector(".question-text").textContent = answerText
                        } else {
                            let img = document.createElement('img')
                            img.classList.add("question-image")
                            img.src = xlsxPath + '/../files/' + answerText
                            document.querySelector(".question-text").textContent = ""
                            document.querySelector(".question-text").appendChild(img)
                        }
                        gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                        gamesData[gameName]['players'] = players
                        fs.writeFileSync('games.json', JSON.stringify(gamesData))
                    }
                    for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                        playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                    }
                })

                playersGameFrame.appendChild(clonedPlayerQuestionCard)
            }
            closeButton.style = 'visibility: hidden'
            document.querySelector('#input-game-name-label').value = ''
            document.querySelector('.users-list').innerHTML = ''
            document.querySelector('.input-game-name-label').value = ''
            document.querySelector('.input-user-label').value = ''
            document.querySelector('.input-file-text').innerHTML = ''
        } else {
            alert('Вы не выбрали игру')
        }
    })

    document.querySelector('.input-game-name-label').addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault()
            document.querySelector('.input-user-field').focus()
        }
    })

    addPlayerButton.addEventListener("click", (e) => {
        e.preventDefault()
        if (document.querySelector("#input-user-field").value.trim().length > 10) {
            alert('Имя должно состоять максимум из 10 символов!')
        } else if (Object.keys(players).length == 5) {
            alert('Максимум 5 игроков!')
            document.querySelector("#input-user-field").value = ""
        } else if (document.querySelector("#input-user-field").value.trim() === "") {
            alert('Введите имя игрока!')
        } else if (document.querySelector("#input-user-field").value in players) {
            alert('Игрок с таким именем уже существует!')
            document.querySelector("#input-user-field").value = ""
        } else {
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
        gameName = document.querySelector('#input-game-name-label').value
        if (xlsxFile === '') {
            alert('Выберите файл для загрузки!')
        } else if (gameName.trim() === '') {
            alert('Введите название игры!')
        } else if (Object.keys(players).length < 2) {
            alert('Введите минимум двух игроков')
        } else {
            timerSeconds = inputRangeField.value
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[2].classList.add("show")

            let field = document.querySelector('.game')

            let data = {
                'xlsxPath': path.resolve(xlsxFile.path),
                'players': players,
                'gameBoard': gameBoard,
                'gameDate': (new Date()).toISOString().slice(0, 10).split('-').reverse().join('.'),
                'timer': timerSeconds
            }

            xlsxPath = xlsxFile.path

            gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
            gamesData[gameName] = data
            fs.writeFileSync('games.json', JSON.stringify(gamesData))

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
                        stopQuestionTimer()
                        for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                            playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                                btn.disabled = false
                            })
                        }
                        backToFieldButton.style.visibility = 'hidden'
                        currentRow = event.target.dataset.row
                        currentCost = (j + 1) * 100
                        gameBoard[questions.length - i - 1][j] = 1


                        gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                        gamesData[gameName]['gameBoard'] = gameBoard
                        fs.writeFileSync('games.json', JSON.stringify(gamesData))

                        let questionText = questions[event.target.dataset.row][event.target.textContent]
                        if (!filesExtensions.includes(questionText.split(".")[questionText.split(".").length - 1])) {
                            document.querySelector(".question-text").textContent = questionText
                        } else {
                            let img = document.createElement('img')
                            img.classList.add("question-image")
                            img.src = xlsxPath + '/../files/' + questionText
                            document.querySelector(".question-text").textContent = ""
                            document.querySelector(".question-text").appendChild(img)
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
                    let answerText = answers[currentRow][currentCost]
                    if (!filesExtensions.includes(answerText.split(".")[answerText.split(".").length - 1])) {
                        document.querySelector(".question-text").textContent = answerText
                    } else {
                        console.log(xlsxFile.path)
                        let img = document.createElement('img')
                        img.classList.add("question-image")
                        img.src = xlsxPath + '/../files/' + answerText
                        document.querySelector(".question-text").textContent = ""
                        document.querySelector(".question-text").appendChild(img)
                    }

                    gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                    gamesData[gameName]['players'] = players
                    fs.writeFileSync('games.json', JSON.stringify(gamesData))

                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btn.disabled = true
                        })
                    }
                    for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                        playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                    }
                    stopQuestionTimer()
                    backToFieldButton.style.visibility = 'hidden'
                })
                clonedPlayerQuestionCard.querySelector('.wrong-answer').addEventListener('click', (e) => {
                    players[key] -= currentCost
                    clonedPlayerQuestionCard.querySelector('.ok-answer').disabled = true
                    clonedPlayerQuestionCard.querySelector('.wrong-answer').disabled = true
                    let btns = []
                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btns.push(btn.disabled)
                        })
                    }
                    if (btns.every((e) => { return e })) {
                        stopQuestionTimer()
                        backToFieldButton.style.visibility = 'visible'
                        for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                            playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                                btn.disabled = true
                            })
                        }
                        let answerText = answers[currentRow][currentCost]
                        if (!filesExtensions.includes(answerText.split(".")[answerText.split(".").length - 1])) {
                            document.querySelector(".question-text").textContent = answerText
                        } else {
                            let img = document.createElement('img')
                            img.classList.add("question-image")
                            img.src = xlsxPath + '/../files/' + answerText
                            document.querySelector(".question-text").textContent = ""
                            document.querySelector(".question-text").appendChild(img)
                        }
                        gamesData = JSON.parse(fs.readFileSync('games.json', 'utf-8'))
                        gamesData[gameName]['players'] = players
                        fs.writeFileSync('games.json', JSON.stringify(gamesData))
                    }
                    for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                        playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                    }
                })

                playersGameFrame.appendChild(clonedPlayerQuestionCard)
            }
            closeButton.style = 'visibility: hidden'
            document.querySelector('#input-game-name-label').value = ''
            document.querySelector('.users-list').innerHTML = ''
            document.querySelector('.input-game-name-label').value = ''
            document.querySelector('.input-user-label').value = ''
            document.querySelector('.input-file-text').innerHTML = ''
        }
    })

    backToFieldButton.addEventListener("click", (e) => {
        e.preventDefault()
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[2].classList.add("show")
        stopQuestionTimer()
    })

    document.querySelector('.input-file input[type=file]').addEventListener('change', function (e) {
        xlsxFile = this.files[0]
        document.querySelector('.input-file-text').textContent = xlsxFile.name

        const reader = XLSX.readFile(xlsxFile.path)


        const questions_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[0]]).reverse()
        questions_temp.forEach((res) => {
            questions.push(res)
        })

        const answers_temp = XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[1]]).reverse()
        answers_temp.forEach((res) => {
            answers.push(res)
        })
    });

    inputRangeField.addEventListener("input", (e) => {
        let inputRangeValue = document.querySelector('.input-range-value')
        inputRangeValue.textContent = `${e.target.value} СЕК.`
    })

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


})