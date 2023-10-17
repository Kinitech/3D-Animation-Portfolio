import {useState, useEffect} from "react";

function AnimatedInput(passedPlaceholder) {
    const typingInterval = 150
    const placeholderInterval = 8
    const intro_text = ">>> "
    const [choiceindex, setChoiceIndex] = useState(0)
    let [placeholder, setPlaceholder] = useState((intro_text + passedPlaceholder[choiceindex].slice(0, 0)));
    const [placeholderIndex, setPlaceholderIndex] = useState(intro_text.length);
    const [doneFlag, setDoneFlag] = useState(false)

    placeholder = placeholderIndex % 2 === 0 && !doneFlag && !((placeholderIndex + 1 > (intro_text + passedPlaceholder[choiceindex]).length))? placeholder + "|" : placeholder
    useEffect(() => {
        const intr = setInterval(() => {
            setPlaceholder((intro_text + passedPlaceholder[choiceindex]).slice(0, placeholderIndex));
            if (placeholderIndex + 1 > (intro_text + passedPlaceholder[choiceindex]).length + placeholderInterval || doneFlag) {
                setDoneFlag(true)
                if (placeholderIndex + 1 === intro_text.length + 17) {
                    setDoneFlag(false)
                    if (choiceindex === passedPlaceholder.length - 1) {
                        setChoiceIndex(0)
                    } else {
                        setChoiceIndex(choiceindex + 1)
                    }
                } else {
                    setPlaceholderIndex(placeholderIndex - 1)
                }
            } else {
                setPlaceholderIndex(placeholderIndex + 1)
            }
        }, typingInterval);
        return () => {
            clearInterval(intr)
        }
    },);
    return (placeholder)
};

export default AnimatedInput;
