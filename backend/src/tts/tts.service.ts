import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface DialogueEntry {
  speaker: 'male' | 'female';
  text: string;
}

export interface TeacherAudioScript {
  introduction?: string;
  explanation?: string;
  examples?: string;
  recap?: string;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  
  // Voice configuration - Edge TTS voice names
  private readonly voices = {
    female: 'en-US-JennyNeural',  // Warm, conversational
    male: 'en-US-GuyNeural',      // Friendly, professional
  };

  private readonly audioDir = path.join(process.cwd(), 'uploads', 'audio');

  constructor() {
    // Ensure audio directory exists
    this.ensureAudioDir();
  }

  private ensureAudioDir() {
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      this.logger.log(`Created audio directory: ${this.audioDir}`);
    }
  }

  /**
   * Generate audio from dialogue script (male/female conversation)
   */
  async generateDialogueAudio(
    dialogueScript: DialogueEntry[],
    summaryId: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `dialogue_${summaryId}_${timestamp}.mp3`;
    const outputPath = path.join(this.audioDir, filename);

    this.logger.log(`Generating dialogue audio for summary ${summaryId} with ${dialogueScript.length} entries`);

    try {
      // Generate audio for each dialogue entry
      const tempFiles: string[] = [];

      for (let i = 0; i < dialogueScript.length; i++) {
        const entry = dialogueScript[i];
        const voice = this.voices[entry.speaker] || this.voices.female;
        const tempFile = path.join(this.audioDir, `temp_${summaryId}_${i}.mp3`);
        
        await this.textToSpeech(entry.text, voice, tempFile);
        tempFiles.push(tempFile);
      }

      // Combine all audio files
      await this.combineAudioFiles(tempFiles, outputPath);

      // Clean up temp files
      for (const tempFile of tempFiles) {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }

      this.logger.log(`Generated dialogue audio: ${filename}`);
      return filename;
    } catch (error) {
      this.logger.error(`Failed to generate dialogue audio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate audio from teacher script (single voice)
   */
  async generateTeacherAudio(
    script: TeacherAudioScript,
    summaryId: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `teacher_${summaryId}_${timestamp}.mp3`;
    const outputPath = path.join(this.audioDir, filename);

    this.logger.log(`Generating teacher audio for summary ${summaryId}`);

    try {
      // Combine all parts of the teacher script
      const fullScript = [
        script.introduction || '',
        script.explanation || '',
        script.examples || '',
        script.recap || '',
      ].filter(Boolean).join(' ');

      if (!fullScript.trim()) {
        throw new Error('Teacher script is empty');
      }

      // Generate audio using female voice (teacher)
      await this.textToSpeech(fullScript, this.voices.female, outputPath);

      this.logger.log(`Generated teacher audio: ${filename}`);
      return filename;
    } catch (error) {
      this.logger.error(`Failed to generate teacher audio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert text to speech using msedge-tts
   */
  private async textToSpeech(text: string, voice: string, outputPath: string): Promise<void> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Generate and save to file - toStream returns { audioStream, metadataStream }
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      audioStream.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, audioBuffer);
        resolve();
      });
      
      audioStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Combine multiple audio files into one
   */
  private async combineAudioFiles(inputFiles: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      
      const processFile = (index: number) => {
        if (index >= inputFiles.length) {
          writeStream.end();
          resolve();
          return;
        }

        const readStream = fs.createReadStream(inputFiles[index]);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', () => {
          processFile(index + 1);
        });
        readStream.on('error', reject);
      };

      writeStream.on('error', reject);
      processFile(0);
    });
  }

  /**
   * Get path to audio file
   */
  getAudioPath(filename: string): string {
    return path.join(this.audioDir, filename);
  }

  /**
   * Check if audio file exists
   */
  audioExists(filename: string): boolean {
    return fs.existsSync(this.getAudioPath(filename));
  }

  /**
   * Delete audio file
   */
  deleteAudio(filename: string): boolean {
    try {
      const filePath = this.getAudioPath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete audio: ${error.message}`);
      return false;
    }
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }
}
