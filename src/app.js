import {createPrng, isPWPreview, setPreviewReady, setProperties} from "./publicworks";
import {generateTraits} from "./traits";
import '../public/p5.sound.min';

let s = (sk) => {
    const {traits, attributes} = generateTraits(createPrng());
    setProperties(attributes, traits);
    let noise, env, analyzer;
    let myPhrase, myPart;
    let positions = [];

    sk.setup = () => {

        sk.getAudioContext().suspend();
        const dimensions = getDimensions();
        sk.createCanvas(...dimensions)
        sk.colorMode(sk.HSL)
        const prng = createPrng()
        noise = new p5.Noise('pink'); // other types include 'brown' and 'pink'
        noise.start();

        // multiply noise volume by 0
        // (keep it quiet until we're ready to make noise!)
        noise.amp(0);


        env = new p5.Env();
        // set attackTime, decayTime, sustainRatio, releaseTime
        let attack = prng.random(0.0001, 0.0005)
        let decay = prng.random(0.05, 0.5)
        let sustain = .1
        let release = prng.random(0.05, 0.2)
        env.setADSR(attack, decay, sustain, release);
        // set attackLevel, releaseLevel
        env.setRange(1, 0);

        let pattern = [1, 0, 0, 1, 0, 1, 0, 0];
        pattern = [];
        //pattern is either 8 or 16 notes
        const plength = prng.randomList([8, 16])
        let noteProbability = 0.2
        for (let i = 0; i < plength; i++) {
            pattern.push(prng.random() < noteProbability ? 1 : 0)
        }

        function onEachStep(time, playbackRate) {
            env.play(noise);
        }

        myPhrase = new p5.Phrase('bbox', onEachStep, pattern);
        myPart = new p5.Part();
        myPart.addPhrase(myPhrase);
        myPart.setBPM(60);

        // // p5.Amplitude will analyze all sound in the sketch
        // // unless the setInput() method is used to specify an input.
        analyzer = new p5.Amplitude();

        const border = Math.round(sk.width * 0.15);
        for (let i = 0; i < traits.numLines; i++) {
            const x = prng.randomInt(border, sk.width - border)
            const y = prng.randomInt(border, sk.height - border)
            positions.push([x, y])
        }
    }

    function playMyPart() {
        sk.userStartAudio();
        myPart.start();
    }

    sk.mousePressed = () => {
        playMyPart()
    }
    sk.draw = () => {
        const bg = sk.color(traits.bgHue, traits.bgSaturation, traits.bgLightness);
        sk.background(bg)


        // get volume reading from the p5.Amplitude analyzer
        let level = analyzer.getLevel();

        let levelHeight = sk.map(level, 0, 0.4, 0, sk.height * .2);
        
        const border = Math.round(sk.width * 0.15);
        const skew = border / traits.layers;

        for (let i = 0; i < traits.layers; i++) {
            sk.push()
            sk.translate((i - Math.floor(traits.layers / 2)) * skew, 0)

            const fg = sk.color(traits.fgHue, traits.fgSaturation * (i / traits.layers), traits.fgLightness * (i / traits.layers));
            sk.fill(fg)
            sk.noStroke()
            sk.beginShape()

            const w2 = sk.width / 2
            const h2 = sk.height / 2
            for (let j = 0; j < positions.length; j++) {
                const x = positions[j][0]
                const y = positions[j][1]
                const dx = (x - w2) / w2 * levelHeight
                const dy = (y - h2) / h2 * levelHeight
                sk.curveVertex(x + dx, y + dy)
            }
            sk.endShape()
            sk.pop()
        }

        setPreviewReady()
    }
    const getDimensions = () => {
        let desiredHeight = sk.windowHeight
        let desiredWidth = sk.windowHeight;
        if (desiredWidth > sk.windowWidth) {
            desiredWidth = sk.windowWidth;
            desiredHeight = sk.windowWidth;
        }
        return [desiredWidth, desiredHeight]
    }
    sk.windowResized = () => {
        if (!isPWPreview()) {
            const dimensions = getDimensions();
            sk.resizeCanvas(...dimensions);
        }
    }
}

export const createSketch = () => {
    return new p5(s, document.getElementById('root'));
}
