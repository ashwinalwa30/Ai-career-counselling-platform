from app.data_loader import get_careers, get_questions, load_data


def test_careers_json_has_twenty_complete_records():
    load_data()
    careers = get_careers()

    assert len(careers) >= 20
    for career in careers:
        assert career.get("riasecTypes"), career.get("id")
        assert career.get("requiredAptitudes"), career.get("id")


def test_questions_json_has_thirty_six_questions_with_answers():
    load_data()
    questions = get_questions()

    assert len(questions) == 36
    for question in questions:
        assert "correctAnswer" in question
        assert question.get("id")
        assert question.get("section")
