from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import speech
import io
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

# Load Google Cloud Speech client
client = speech.SpeechClient.from_service_account_file('key.json')

@app.route('/')
@app.route('/transcribe', methods=['POST'])
def transcribe():
    logging.debug('Received transcription request')

    # Log the request files and form
    logging.debug(f'Request files: {request.files}')
    logging.debug(f'Request form: {request.form}')

    if 'audio_file' not in request.files:
        logging.debug('No audio file provided')
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio_file']
    if file.filename == '':
        logging.debug('No selected file')
        return jsonify({'error': 'No selected file'}), 400

    language_code = request.form.get('language')
    if not language_code:
        logging.debug('Language not specified')
        return jsonify({'error': 'Language not specified'}), 400

    audio_content = file.read()
    logging.debug('Read audio content successfully')
    audio = speech.RecognitionAudio(content=audio_content)

    # Configuring transcription
    config = speech.RecognitionConfig(
        enable_automatic_punctuation=True,
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code=language_code,
        model="default"
    )

    try:
        response = client.recognize(config=config, audio=audio)
    except Exception as e:
        logging.error(f'Error during transcription: {e}')
        return jsonify({'error': str(e)}), 500

    transcription = ''
    for result in response.results:
        transcription += result.alternatives[0].transcript

    if not transcription:
        logging.debug('No transcription available')
        return jsonify({'error': 'No transcription available'}), 500

    logging.debug(f'Transcription successful: {transcription}')
    return jsonify({'transcription': transcription}), 200

if __name__ == '__main__':
    app.run(debug=True)
