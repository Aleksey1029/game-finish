const username = 'Yura'
let betsum = 1000
let game_id = ''
let level
let popUp = document.getElementById('popUp')

getUser()

let bets = document.querySelectorAll('.bet')
bets.forEach(btn => {
	btn.addEventListener('click', betSelector)
	btn.setAttribute('data-sum', btn.innerHTML)
})

function betSelector() {
	bets.forEach(btn => {
		btn.classList.remove('selected')
	})

	let currentBtn = event.target
	currentBtn.classList.add('selected')

	betsum = currentBtn.getAttribute('data-sum')
	console.log(betsum)
}

let playBtn = document.querySelector('.play')
playBtn.setAttribute('data-status', 'start')
playBtn.addEventListener('click', startStop)

async function startStop() {
	let status = playBtn.getAttribute('data-status')

	playBtn.removeAttribute('disabled', 'true')

	if (status == 'start') {
		let isStarted = await newGame()

		if (isStarted) {
			playBtn.innerHTML = 'Завершить игру'
			playBtn.setAttribute('data-status', 'stop')
			level = 1
			activateLine()
		}
		playBtn.removeAttribute('disabled')
	} else {
		let isWon = await stopGame()

		if (isWon) {
			cleanArea()
			playBtn.innerHTML = 'Играть'
			playBtn.setAttribute('data-status', 'start')
		}
		playBtn.removeAttribute('disabled')
	}
}

// Подключение к API

async function sendRequest(url, method, data) {
	url = `https://tg-api.tehnikum.school/tehnikum_course/${url}`

	if (method == 'POST') {
		let response = await fetch(url, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		response = await response.json()
		return response
	} else if (method == 'GET') {
		url = url + '?' + new URLSearchParams(data)
		let response = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		})
		response = await response.json()
		return response
	}
}

async function getUser() {
	let user = await sendRequest('get_user', 'POST', { username: username })

	if (user.error) {
		alert(user.message)
	} else {
		let userInfo = document.getElementById('user')
		userInfo.innerHTML = `[Логин ${username}, Баланс ${user.balance}]`

		playBtn.removeAttribute('disabled')
	}
}

async function newGame() {
	let game = await sendRequest('new_game', 'POST', {
		username: username,
		points: +betsum,
	})

	if (game.error) {
		alert(user.message)
		return false
	} else {
		game_id = game.game_id
		console.log(game_id)
		return true
	}
}

async function stopGame() {
	let stop = await sendRequest('game_win', 'POST', { username, game_id, level })

	if (stop.error) {
		alert(stop.message)
		return false
	} else {
		getUser()

		popUp.classList.add('active')
		popUp.innerHTML = ``
		popUp.innerHTML =
			popUp.innerHTML +
			`
	<div>Уровень ${level}</div>
	<div><span>x</span> ${stop.cf_won}</div>
	<div><span>Выигрыш</span> ${stop.points_won} Баллов</div>
	`

		setTimeout(() => {
			popUp.classList.remove('active')
		}, 3000)
		return true
	}
}

function activateLine() {
	let gameBtns = document.querySelectorAll('.line:last-child .gameButton')
	gameBtns.forEach((btn, i) => {
		setTimeout(() => {
			btn.classList.add('active')
			btn.addEventListener('click', makeStep)
			btn.setAttribute('data-line', level)
			btn.setAttribute('data-step', i + 1)
		}, 50 * i)
	})
}

function cleanArea() {
	let gameTable = document.querySelector('.gameTable')
	gameTable.innerHTML = `
		<div class='line'>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameText'>x 1.20</div>
		</div>`
}

async function makeStep() {
	let stepBtn = event.target
	let line = +stepBtn.getAttribute('data-line')
	let step = +stepBtn.getAttribute('data-step')

	let response = await sendRequest('game_step', 'POST', {
		username,
		game_id,
		step,
		line,
	})

	if (response.error) {
		alert(response.message)
	} else {
		stepBtn.classList.add('step')
		if (response.win === 1) {
			//выиграл
			level = level + 1
			showLine(response.bomb1, response.bomb2, response.bomb3)
			newLine(response.cf)
			activateLine()
		} else {
			//проиграл

			showLine(response.bomb1, response.bomb2, response.bomb3)

			popUp.classList.add('active')
			popUp.innerHTML = ``
			popUp.innerHTML =
				popUp.innerHTML +
				`
          <div style="
          color:rgb(186, 0, 68); 
          font-size:20px;
          font-weight: 700;">
          ПРОИГРЫШ</div>
          <div>Попробуйте еще раз?</div>
          `

			playBtn.removeAttribute('disabled', true)
			playBtn.innerHTML = 'Играть'
			playBtn.setAttribute('data-status', 'start')

			setTimeout(() => {
				popUp.classList.remove('active')
				playBtn.removeAttribute('disabled')

				cleanArea()
			}, 2500)
		}
	}

	console.log(stepBtn, line, step)
}

function showLine(sk1, sk2, sk3) {
	let gameBtns = document.querySelectorAll('.gameButton.active')
	gameBtns.forEach((btn, i) => {
		btn.classList.remove('active')
		if (i + 1 == sk1 || i + 1 == sk2 || i + 1 == sk3) {
			btn.classList.add('skeleton')
		} else {
			btn.classList.add('diamond')
		}
	})
}

function newLine(cf) {
	let gameTable = document.querySelector('.gameTable')
	gameTable.innerHTML =
		gameTable.innerHTML +
		`
		<div class='line'>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameButton'></div>
			<div class='gameText'>x ${cf}</div>
		</div>`
}
