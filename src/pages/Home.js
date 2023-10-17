import SketchBackground from "../components/sketch";
import Description from "../components/Description";
import AnimatedText from "../components/AnimatedText";
import HeroSection from "../components/Hero";


function Home({page, onFinish, colors, circleRefs}) {
    const descriptions = [
        {
            title: 'BSc Degree in Neuroscience (1st Class Honours)',
            subDescription: ['Trained as a neuroscientist at University College London (UCL)'],
            focus: ['Pain', 'Diseases', 'Ethics', 'Genetics', 'Neuroanatomy'],
        },
        {
            title: 'Full-stack Development',
            subDescription: ['Experience working in a variety of languages and frameworks'],
            focus: ['React', 'Python', 'AWS', 'React Native'],
        },
        {
            title: 'Machine Learning',
            subDescription: ['Trained in machine learning and data science'],
            focus: ['Tensorflow', 'PyTorch', 'Scikit-learn', 'Numpy', 'Pandas'],
        },
        {
            title: 'Data Visualisation',
            subDescription: ['Experience creating unique and interactive data visualisations'],
            focus: ['D3.js', 'Python', 'Three.js', 'SVG', 'Canvas'],
        }
    ];

    const intro = "Hi I'm Byron, a ";

    // CURRENTLY Missing <SketchBackground/> and <div className="dot-pattern"/>
    // Whilst I fiddle with HeroSection
    return (
        <>
            <div className="container">
                <HeroSection/>
                <div className="header">
                    <h1 className="code-text"> {AnimatedText([
                        intro + "programmer",
                        intro + "neuroscientist",
                        intro + "data enthusiast",
                        intro + "web developer",
                        intro + "machine learner",
                        intro + "data visualiser"])}
                    </h1>
                </div>
                <Description page={page} colors={colors} descriptions={descriptions} onFinish={onFinish} circleRefs={circleRefs}/>
            </div>
        </>
    )
}

export default Home;
