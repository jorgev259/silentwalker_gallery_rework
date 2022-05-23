const sharp = require('sharp')
const glob = require('glob')
const fs = require('fs-extra')
const checksum = require('checksum')

const quality = 30
const cache = fs.readJSONSync('./thumbCache.json', { throws: false }) || {}

let max
let current = 0

function skipFile (outFilePath) {
  current++
  console.log(`Skipped "${outFilePath}" (${current}/${max})`)
}

async function optimiseFile (filePath) {
  const check = checksum(filePath)

  let parentDir = filePath.split('/')
  const fileName = parentDir.pop().split('.').shift()
  parentDir = parentDir.join('/')
  const outFilePath = filePath.replace('wallpapers/', '')

  const outputDir = parentDir.replace('wallpapers/', 'public/images/thumbs/')
  const outputPath = `${outputDir}/${fileName}`

  if (
    cache[filePath] === check ||
    (!cache[filePath] && fs.existsSync(`${outputPath}.jpg`) && fs.existsSync(`${outputPath}.webp`))
  ) return skipFile(outFilePath)

  cache[filePath] = check

  await fs.ensureDir(outputDir)
  const image = sharp(filePath)

  await Promise.all([
    image.jpeg({ quality }).toFile(`${outputPath}.jpg`),
    image.webp({ quality }).toFile(`${outputPath}.webp`)
  ])

  current++
  console.log(`Created thumbnail for "${outFilePath}" (${current}/${max})`)
}

async function main () {
  const files = glob.sync('wallpapers/**/*.{jpg,jpeg,png}')
  max = files.length

  await Promise.all(files.map(f => optimiseFile(f)))
  await fs.outputJSON('./thumbCache.json', cache, { spaces: 4 })
}

main()
