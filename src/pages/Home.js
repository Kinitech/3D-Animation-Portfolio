import './Home.css';
import Description from "../components/Description";
import AnimatedText from "../components/AnimatedText";
import ThreeJSMesh from "../components/ThreeJSMesh";
import {useEffect, useState} from "react";

function LoadingAnimation({fadeOut}) {
    // Black screen
    return (
        <div className={fadeOut ? "loading fade-out" : "loading"}/>
    )
}

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
            focus: ['Python', 'AWS', 'React', 'Node.js', 'Firebase', 'JavaScript'],
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

    const [loaded, setLoaded] = useState(false);
    const [showLoading, setShowLoading] = useState(true);

    const intro = "Hi I'm Byron, a ";

    // Delay to remove loading screen
    useEffect(() => {
        if (loaded) {
            setTimeout(() => {
                setShowLoading(false);
            }, 1000);  // 1 second matches the CSS transition time
        }
    }, [loaded]);

    return (
        <>
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
            <div className="container">
                {showLoading ? <LoadingAnimation fadeOut={loaded}/> : null}
                <ThreeJSMesh setLoaded={setLoaded}/>
                <Description page={page} colors={colors} descriptions={descriptions} onFinish={onFinish} circleRefs={circleRefs}/>
            </div>
        </>
    )
}

export default Home;
