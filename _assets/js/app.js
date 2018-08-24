const urls = [
  'https://www.youtube.com/watch?v=VFVK1cd9P2k',
  'https://www.youtube.com/watch?v=FZUcpVmEHuk'
]

const wavy = document.querySelector('.js-random-url')

if (wavy) {
  wavy.href = urls[Math.floor(Math.random() * urls.length)]
}
