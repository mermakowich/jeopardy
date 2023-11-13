// const { dialog } = require('electron')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')


window.addEventListener('DOMContentLoaded', () => {

    const fillSaveGame = async () => {
        let games = JSON.parse(fs.readFileSync(games_path))
        document.querySelector('.save-game-list').innerHTML = ''
        for (let [i, name] of Object.keys(games).entries()) {
            let saveGameItemTemplate = document.querySelector('#save-game-item-template').content
            let saveGameItem = saveGameItemTemplate.querySelector('li')
            let clonedSaveGameItem = saveGameItem.cloneNode(true)
            let clonedInput = clonedSaveGameItem.querySelector('input')
            clonedInput.value = name
            clonedSaveGameItem.dataset.gameName = name
            clonedSaveGameItem.querySelector('.game-name').innerHTML = `${name} (${games[name]['gameDate']})`
            clonedSaveGameItem.querySelector('.delete-save-game-button').addEventListener("click", (e) => {
                e.preventDefault()
                if ("save-game-item" === e.target.parentElement.classList.value) {
                    e.target.parentElement.remove()
                    deleteGameData(e.target.parentElement.dataset.gameName)
                } else {
                    e.target.parentElement.parentElement.remove()
                    deleteGameData(e.target.parentElement.parentElement.dataset.gameName)
                }
            })
            document.querySelector('.save-game-list').appendChild(clonedSaveGameItem)
        }
    }

    const fillQuestionText = async (i, j, type) => {
        let questionText
        if (type === 'question') {
            questionText = questions[i][j].toString()
        } else {
            questionText = answers[i][j].toString()
        }
        let extension = questionText.split(".")[questionText.split(".").length - 1].toLowerCase()
        if (filesPhotoExtensions.includes(extension)) {
            let img = document.createElement('img')
            img.classList.add("question-image")
            img.src = xlsxPath + '/../files/' + questionText
            document.querySelector(".question-text").textContent = ""
            document.querySelector(".question-text").appendChild(img)
        } else if (filesVideoExtensions.includes(extension)) {
            let video = document.createElement("video")
            video.setAttribute("autoplay", "")
            video.classList.add("question-image")
            let source = document.createElement("source")
            source.setAttribute("src", xlsxPath + '/../files/' + questionText)
            source.setAttribute("type", `video/${extension}`);
            video.appendChild(source)
            document.querySelector(".question-text").textContent = ''
            document.querySelector(".question-text").appendChild(video)
        } else {
            document.querySelector(".question-text").textContent = questionText
        }
    }

    document.addEventListener("timer-tick", (e) => {
        let width = questionTimer.parentNode.offsetWidth
        start = Date.now()
        let tick = width / (timerSeconds * 1000)
        timer = setInterval(() => {
            canEsc = true
            timePassed = Date.now() - start + pauseTime
            if (timePassed <= timerSeconds * 1000) {
                questionTimer.style = `width: ${tick * timePassed}px`
            } else {
                stopQuestionTimer()
                clearInterval(timer)
                backToFieldButton.style.visibility = 'visible'
                for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                    playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                        btn.disabled = true
                    })
                }
                fillQuestionText(currentRow, currentCost, 'answer')
                params = {
                    'gameName': gameName,
                    'xlsxPath': null,
                    'players': players,
                    'gameBoard': gameBoard,
                    'gameDate': null,
                    'timerSeconds': null
                }
                setGameData(params)
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
                    canEsc = false
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
        timerFlag = false
        pauseTime = 0
    }

    const setPlayersFrame = async () => {
        let playersFrame = document.querySelector('.players-frame')
        for (let [key, value] of Object.entries(players)) {
            let playerCardTemplate = document.querySelector('#player-card-template').content
            let playerCard = playerCardTemplate.querySelector('div')
            let clonedPlayerCard = playerCard.cloneNode(true)
            clonedPlayerCard.querySelector('.player-name').textContent = key
            clonedPlayerCard.querySelector('.player-score').textContent = value

            playersFrame.appendChild(clonedPlayerCard)
        }
    }

    const setPlayersGameFrame = async () => {
        let playersGameFrame = document.querySelector('.players-game-frame')
        for (let key of Object.keys(players)) {
            let playerQuestionCardTemplate = document.querySelector('#player-question-card-template').content
            let playerQuestionCard = playerQuestionCardTemplate.querySelector('div')
            let clonedPlayerQuestionCard = playerQuestionCard.cloneNode(true)
            clonedPlayerQuestionCard.querySelector('.player-name').textContent = key
            clonedPlayerQuestionCard.querySelector('.ok-answer').addEventListener('click', (e) => {
                players[key] += currentCost
                fillQuestionText(currentRow, currentCost, 'answer')

                params = {
                    'gameName': gameName,
                    'xlsxPath': null,
                    'players': players,
                    'gameBoard': gameBoard,
                    'gameDate': null,
                    'timerSeconds': null
                }
                setGameData(params)

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
                    fillQuestionText(currentRow, currentCost, 'answer')
                    params = {
                        'gameName': gameName,
                        'xlsxPath': null,
                        'players': players,
                        'gameBoard': gameBoard,
                        'gameDate': null,
                        'timerSeconds': null
                    }
                    setGameData(params)
                }
                for (let playerCard of document.querySelector(".players-frame").querySelectorAll(".player-card")) {
                    playerCard.querySelector(".player-score").innerHTML = players[playerCard.querySelector(".player-name").innerHTML]
                }
            })

            playersGameFrame.appendChild(clonedPlayerQuestionCard)
        }
    }

    const getGameData = async (gameName) => {
        gamesData = JSON.parse(fs.readFileSync(games_path, 'utf-8'))[gameName]
        players = gamesData['players']
        gameBoard = gamesData['gameBoard']
        xlsxPath = gamesData['xlsxPath']
        timerSeconds = gamesData['timerSeconds']
    }

    const setGameData = async (params) => {
        let [gameName, currentXlsxPath, currentPlayers, currentGameBoard, currentGameDate, currentTimerSeconds] = Object.values(params)
        gamesData = JSON.parse(fs.readFileSync(games_path, 'utf-8'))
        if (!(gameName in gamesData)) {
            gamesData[gameName] = {
                'gameName': null,
                'xlsxPath': null,
                'players': null,
                'gameBoard': null,
                'gameDate': null,
                'timerSeconds': null
            }
        }

        if (currentXlsxPath != null) gamesData[gameName]['xlsxPath'] = currentXlsxPath
        if (currentPlayers != null) gamesData[gameName]['players'] = currentPlayers
        if (currentGameBoard != null) gamesData[gameName]['gameBoard'] = currentGameBoard
        if (currentGameDate != null) gamesData[gameName]['gameDate'] = currentGameDate
        if (currentTimerSeconds != null) gamesData[gameName]['timerSeconds'] = currentTimerSeconds
        fs.writeFileSync(games_path, JSON.stringify(gamesData))
    }

    const fillQuestionButtons = async () => {
        let field = document.querySelector('.game')
        getGameData(gameName)
        for (let i = 0; i < questions.length; i++) {
            let rowTemplate = document.querySelector('#row-template').content
            let themeTemplate = document.querySelector('#theme-template').content
            let theme = themeTemplate.querySelector('div')
            let row = rowTemplate.querySelector('div')
            let clonedTheme = theme.cloneNode(true)
            let clonedRow = row.cloneNode(true)
            clonedTheme.children[0].textContent = Object.values(questions[i])[Object.values(questions[i]).length - 1]
            clonedRow.appendChild(clonedTheme)
            for (let j = 0; j < Object.values(questions[i]).length - 1; j++) {
                let buttonTemplate = document.querySelector('#button-template').content.querySelector('button')
                let clonedButton = buttonTemplate.cloneNode(true)
                clonedButton.textContent = Object.keys(questions[i])[j]
                clonedButton.dataset.row = i
                if (gameBoard[questions.length - i - 1][j] == 1) {
                    clonedButton.disabled = true
                }
                clonedButton.addEventListener('click', (event) => {
                    clearInterval(timer)
                    stopQuestionTimer()
                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btn.disabled = false
                        })
                    }
                    backToFieldButton.style.visibility = 'hidden'
                    currentRow = event.target.dataset.row
                    currentCost = Number(Object.keys(questions[i])[j])
                    gameBoard[questions.length - i - 1][j] = 1

                    params = {
                        'gameName': gameName,
                        'xlsxPath': null,
                        'players': null,
                        'gameBoard': gameBoard,
                        'gameDate': null,
                        'timerSeconds': timerSeconds
                    }
                    setGameData(params)

                    fillQuestionText(event.target.dataset.row, event.target.textContent, 'question')
                    startQuestionTimer(event, false, false)
                })
                clonedRow.appendChild(clonedButton)
            }
            field.insertBefore(clonedRow, field.children[0])
        }
    }

    const createGameWindow = async () => {
        setPlayersFrame()
        fillQuestionButtons()
        setPlayersGameFrame()
        closeButton.style = 'visibility: hidden'
        document.querySelector('#input-game-name-label').value = ''
        document.querySelector('.users-list').innerHTML = ''
        document.querySelector('.input-game-name-label').value = ''
        document.querySelector('.input-user-label').value = ''
        document.querySelector('.input-file-text').innerHTML = ''
    }

    const setQuestions = async (path) => {
        const reader = XLSX.readFile(path)
        questions = []
        answers = []
        XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[0]]).reverse().forEach((res) => { questions.push(res) })
        XLSX.utils.sheet_to_json(reader.Sheets[reader.SheetNames[1]]).reverse().forEach((res) => { answers.push(res) })
    }

    const deleteGameData = async (gameName) => {
        gamesData = JSON.parse(fs.readFileSync(games_path, 'utf-8'))
        delete gamesData[gameName]
        fs.writeFileSync(games_path, JSON.stringify(gamesData))
    }

    const fillPedestal = async () => {
        let stringScores = Object.values(players)
        let playersCopy = players
        let scores = stringScores.map(n => { return parseInt(n, 10) })
        scores.sort((a, b) => a - b)
        scores = scores.reverse()
        document.querySelector('.first-place-player-name').innerHTML = Object.keys(playersCopy).find(key => playersCopy[key] === scores[0])
        document.querySelector('.first-place-player-score').innerHTML = scores[0]
        delete playersCopy[Object.keys(playersCopy).find(key => playersCopy[key] === scores[0])]
        document.querySelector('.second-place-player-name').innerHTML = Object.keys(playersCopy).find(key => playersCopy[key] === scores[1])
        document.querySelector('.second-place-player-score').innerHTML = scores[1]
        delete playersCopy[Object.keys(playersCopy).find(key => playersCopy[key] === scores[1])]
        if (scores.length >= 3) {
            document.querySelector('.third-place-player-name').innerHTML = Object.keys(playersCopy).find(key => playersCopy[key] === scores[2])
            document.querySelector('.third-place-player-score').innerHTML = scores[2]
            delete playersCopy[Object.keys(playersCopy).find(key => playersCopy[key] === scores[2])]
        } else {
            document.querySelector('.third-place-div').style = "visibility: hidden"
        }
    }

    let questions = []
    let answers = []
    let xlsxPath = ''
    let players = {}
    let currentRow = 0
    let currentCost = 0
    let eventTimer = null
    let timer = null
    let canEsc = true
    let circleTimer = null
    let timerFlag = false
    let timePassed = 0
    let pauseTime = null
    let gameName = ''
    let gamesData = null
    let filesPhotoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg', 'raw', 'psd']
    let filesVideoExtensions = ['mp4', 'mpeg', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv', '3gp']
    let gameBoard

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
    let newGameElements = document.querySelectorAll(".new-game-sidebar input, .new-game-sidebar button, .input-file")
    let loadGameElements = document.querySelectorAll(".load-game-sidebar input, .load-game-sidebar button, .save-game-list")
    let faqBackButton = document.querySelector("#faq-back-button")
    let faqStartGameButton = document.querySelector("#faq-start-game-button")
    let closeButton = document.querySelector("#close-button")
    let endGameButton = document.querySelector('.end-game-button')
    let games_path = path.join("/tmp", "games.json")
    if (navigator.platform == "Win32") {
        games_path = "games.json"  
    }
    let timerSeconds = 10
    let currentSliderNumber = 0
    sliderPages.textContent = `${currentSliderNumber + 1} / ${sliders.length}`

    fs.access(games_path, (e) => {
        if (e) {
            fs.writeFileSync(games_path, JSON.stringify({}))
        }
    });

    document.addEventListener("mousedown", (e) => {
        let section_index = 0
        let sections = document.querySelectorAll("section")
        for (let i = 0; i < sections.length; i++) {
            if ("show" == sections[i].className.toLowerCase()) {
                section_index = i
            }
        }
        if (e.button == 2) {
            if (section_index == 3) {
                if (timerFlag) {
                    clearInterval(timer)
                    startQuestionTimer(null, true, false)
                } else {
                    clearInterval(timer)
                    startQuestionTimer(null, true, true)
                }
                timerFlag = !timerFlag
            }
        } else if (e.button == 1) {
            if (section_index == 3) {
                stopQuestionTimer()
                clearInterval(timer)
                backToFieldButton.style.visibility = 'visible'
                for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                    playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                        btn.disabled = true
                    })
                }
                fillQuestionText(currentRow, currentCost, 'answer')
                params = {
                    'gameName': gameName,
                    'xlsxPath': null,
                    'players': players,
                    'gameBoard': gameBoard,
                    'gameDate': null,
                    'timerSeconds': null
                }
                setGameData(params)
            }
        }
    })

    document.addEventListener("keydown", (e) => {
        let section_index = 0
        let new_section = 0
        let flag = true
        let sections = document.querySelectorAll("section")
        for (let i = 0; i < sections.length; i++) {
            if ("show" == sections[i].className.toLowerCase()) {
                section_index = i
            }
        }
        switch (e.key) {
            case "Escape":
                if (canEsc) {
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
                            xlsxPath = ''
                            players = {}
                            gameName = ''
                            fillSaveGame()
                            document.querySelector('.players-game-frame').innerHTML = ''
                            break
                        case 3:
                            stopQuestionTimer()
                            if (gameBoard.every(row => row.every(elem => elem == 1) == true)) {
                                tabs.forEach((tab) => {
                                    tab.classList.remove("show")
                                })
                                tabs[5].classList.add("show")
                                flag = false
                                fillPedestal()
                            } else {
                                new_section = 2
                            }
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

                    if (flag) {
                        tabs.forEach((tab) => {
                            tab.classList.remove("show")
                        })

                        tabs[new_section].classList.add("show")

                    }
                }
                break
            case " ":
                if (section_index == 3) {
                    if (timerFlag) {
                        clearInterval(timer)
                        startQuestionTimer(null, true, false)
                    } else {
                        clearInterval(timer)
                        startQuestionTimer(null, true, true)
                    }
                    timerFlag = !timerFlag
                }
                break
            case "Enter":
                if (section_index == 3) {
                    stopQuestionTimer()
                    clearInterval(timer)
                    backToFieldButton.style.visibility = 'visible'
                    for (playerCard of document.querySelector('.players-game-frame').querySelectorAll('.player-question-card')) {
                        playerCard.querySelectorAll('.answer-check-button').forEach((btn) => {
                            btn.disabled = true
                        })
                    }
                    fillQuestionText(currentRow, currentCost, 'answer')
                    params = {
                        'gameName': gameName,
                        'xlsxPath': null,
                        'players': players,
                        'gameBoard': gameBoard,
                        'gameDate': null,
                        'timerSeconds': null
                    }
                    setGameData(params)
                }
                break
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
                checkedGame = true
            }
        })

        if (!checkedGame) {
            alert('Вы не выбрали игру')
        } else {
            getGameData(gameName)
            setQuestions(xlsxPath)
            if (questions.length === 0) {
                alert('Не удалось найти файл, который был использован для формирования игрового поля!')
            } else {
                createGameWindow()
                tabs.forEach((tab) => {
                    tab.classList.remove("show")
                })
                tabs[2].classList.add("show")
            }
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
        if (xlsxPath === '') {
            alert('Выберите файл для загрузки!')
        } else if (gameName.trim() === '') {
            alert('Введите название игры!')
        } else if (Object.keys(players).length < 2) {
            alert('Введите минимум двух игроков')
        } else if (gameName.trim() in JSON.parse(fs.readFileSync(games_path, 'utf-8'))) {
            alert('Игра с таким названием уже существует!')
            gameName = document.querySelector('#input-game-name-label').value = ""
        } else {
            timerSeconds = inputRangeField.value
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[2].classList.add("show")
            params = {
                'gameName': gameName,
                'xlsxPath': path.resolve(xlsxPath),
                'players': players,
                'gameBoard': Array(questions.length).fill(Array(Object.values(questions[0]).length - 1).fill(0)),
                'gameDate': (new Date()).toISOString().slice(0, 10).split('-').reverse().join('.'),
                'timerSeconds': timerSeconds
            }
            setGameData(params)
            createGameWindow()
        }
    })

    backToFieldButton.addEventListener("click", (e) => {
        e.preventDefault()
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[2].classList.add("show")
        clearInterval(timer)
        stopQuestionTimer()
        if (gameBoard.every(row => row.every(elem => elem == 1) == true)) {
            tabs.forEach((tab) => {
                tab.classList.remove("show")
            })
            tabs[5].classList.add("show")
            fillPedestal()
        }
    })

    endGameButton.addEventListener('click', (e) => {
        tabs.forEach((tab) => {
            tab.classList.remove("show")
        })
        tabs[0].classList.add("show")
        deleteGameData(gameName)
        closeButton.style = ''
        document.querySelector('.game').innerHTML = '<div class="players-frame"></div>'
        questions = []
        answers = []
        xlsxPath = ''
        players = {}
        gameName = ''
        fillSaveGame()
        document.querySelector('.players-game-frame').innerHTML = ''
        document.querySelector('.third-place-div').style = "visibility: visible"
    })

    document.querySelector('.input-file input[type=file]').addEventListener('change', function (e) {
        let xlsxFile = this.files[0]

        document.querySelector('.input-file-text').innerHTML = xlsxFile.name
        this.value = null
        xlsxPath = xlsxFile.path
        setQuestions(xlsxPath)
    });

    inputRangeField.addEventListener("input", (e) => {
        let inputRangeValue = document.querySelector('.input-range-value')
        inputRangeValue.textContent = `${e.target.value} СЕК.`
    })

    newGameFormSidebar.addEventListener("click", (e) => {
        newGameElements.forEach((el) => el.style = "pointer-events: auto;")
        loadGameElements.forEach((el) => {
            el.style = "pointer-events: none;"
        })
        if (!e.target.classList.contains("active-sidebar") && e.target.classList.contains("menu-sidebar")) {
            loadGameFormSidebar.classList.remove("active-sidebar")
            e.target.classList.add("active-sidebar")
            newGameElements.forEach((el) => el.disabled = false)
        }
    })

    loadGameElements.forEach((el) => el.style = "pointer-events: none;")

    loadGameFormSidebar.addEventListener("click", (e) => {
        loadGameElements.forEach((el) => el.style = "pointer-events: auto;")
        newGameElements.forEach((el) => {
            el.style = "pointer-events: none;"
            el.addEventListener('click', (event) => {
                newGameFormSidebar.click()
            })
        })
        if (!e.target.classList.contains("active-sidebar") && e.target.classList.contains("menu-sidebar")) {
            newGameFormSidebar.classList.remove("active-sidebar")
            e.target.classList.add("active-sidebar")
            loadGameElements.forEach((el) => el.disabled = false)
        }
    })


})