

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Pweza } from './components/Pweza';
import { ArticlePage } from './components/ArticlePage';
import { MatchDetailPage } from './components/MatchDetailPage';
import { Match, NewsStory, MatchStatus, SystemAlert, FeedItem } from './types';
import { HashRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

const generateMockData = () => {
  const matches: Match[] = [
    {
      id: 'm1',
      league: 'NFL',
      homeTeam: { 
          id: 't1', 
          name: 'Patriots', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/b/b9/New_England_Patriots_logo.svg',
          form: ['W', 'W', 'D', 'W', 'L'],
          record: '14-4-2',
          rank: 2
      },
      awayTeam: { 
          id: 't2', 
          name: 'Dolphins', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/3/37/Miami_Dolphins_logo.svg',
          form: ['W', 'W', 'W', 'D', 'W'],
          record: '15-3-2',
          rank: 1
      },
      status: MatchStatus.LIVE,
      time: "67'",
      score: { home: 24, away: 10 },
      venue: 'Gillette Stadium',
      attendance: '65,878',
      venueDetails: {
          capacity: '65,878',
          opened: '2002',
          city: 'Foxborough',
          country: 'USA',
          imageUrl: 'https://images.unsplash.com/photo-1534063806967-80252b489955?q=80&w=1000&auto=format&fit=crop',
          description: "Gillette Stadium is the home of the New England Patriots. Known for its raucous atmosphere in winter games, it features a signature lighthouse and bridge.",
          mapUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop"
      },
      referee: 'Bill Vinovich',
      stats: {
          possession: { home: 55, away: 45 },
          shots: { home: 340, away: 280 },
          corners: { home: 18, away: 12 },
          fouls: { home: 4, away: 6 },
      },
      keyPlayers: {
          home: [
              { id: 'p1', name: 'Mac Jones', avatar: 'https://ui-avatars.com/api/?name=Mac+Jones&background=0D47A1&color=fff', number: 10, position: 'QB', stats: [{ label: 'YDS', value: 240 }, { label: 'TD', value: 2 }], rating: 8.5 },
              { id: 'p2', name: 'R. Stevenson', avatar: 'https://ui-avatars.com/api/?name=R+S&background=0D47A1&color=fff', number: 38, position: 'RB', stats: [{ label: 'YDS', value: 85 }, { label: 'AVG', value: 4.2 }], rating: 7.8 }
          ],
          away: [
              { id: 'p3', name: 'Tua Tagovailoa', avatar: 'https://ui-avatars.com/api/?name=Tua&background=008E97&color=fff', number: 1, position: 'QB', stats: [{ label: 'YDS', value: 180 }, { label: 'INT', value: 1 }], rating: 6.2 }
          ]
      },
      timeline: [
          { id: 'tl1', type: 'GOAL', minute: "62'", player: 'R. Stevenson', teamId: 't1', description: "Runs it in from 15 yards out! The blocking was incredible.", mediaUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=500&auto=format&fit=crop" },
          { id: 'tl2', type: 'SOCIAL', minute: "55'", source: "@NextGenStats", avatar: "https://ui-avatars.com/api/?name=NG&background=000&color=fff", description: "Mac Jones has completed 8/9 passes under pressure today. That's his season best.", likes: 1240 },
          { id: 'tl3', type: 'SOCIAL', minute: "48'", source: "@BleacherReport", avatar: "https://ui-avatars.com/api/?name=BR&background=000&color=fff", description: "This snow game is absolutely chaotic ❄️🏈", mediaUrl: "https://images.unsplash.com/photo-1517137879134-48acf67b9737?q=80&w=500&auto=format&fit=crop", likes: 8500 },
          { id: 'tl4', type: 'GOAL', minute: "34'", player: 'Tyreek Hill', teamId: 't2', description: "Caught a screen pass and TOOK OFF. 60 yard TD.", mediaUrl: "https://images.unsplash.com/photo-1611989679192-34f7803ba900?q=80&w=500&auto=format&fit=crop" }
      ],
      prediction: {
        outcome: 'HOME',
        confidence: 78,
        scorePrediction: '27-17',
        aiReasoning: 'Patriots defensive scheme limiting Dolphins run game. Home advantage significant in Q4.',
        keyInsight: 'Strong home advantage in snow.',
        xG: { home: 2.15, away: 0.88 },
        weather: 'Snow 2°C',
        sentiment: 'POSITIVE',
        injuries: ['Trent AA (Out)', 'Alisson (Doubt)'],
        probability: { home: 55, draw: 0, away: 45 },
        isValuePick: true,
        potentialReturn: '+120',
        odds: { home: 2.20, draw: 12.00, away: 1.65 }
      },
      context: {
          headline: "Mac Jones playing efficient football in snowy conditions.",
          injuryReport: "Tyreek Hill (Ankle) - Questionable return",
          commentCount: 4230,
          isHot: true
      },
      broadcaster: 'CBS',
      bettingTrends: {
          homeMoneyPercent: 65,
          homeTicketPercent: 45,
          lineMovement: 'DRIFTING_HOME',
          publicConsensus: 'Sharps pounding Patriots'
      }
    },
    {
      id: 'm4',
      league: 'NBA',
      homeTeam: {
        id: 'nba1',
        name: 'Lakers',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
        record: '24-12',
      },
      awayTeam: {
        id: 'nba2',
        name: 'Warriors',
        logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
        record: '20-16',
      },
      status: MatchStatus.LIVE,
      time: 'Q3 8:42',
      score: { home: 89, away: 86 },
      stats: {
          possession: { home: 48, away: 42 },
          shots: { home: 48, away: 42 },
          shotsOnTarget: { home: 35, away: 38 },
          fouls: { home: 12, away: 14 },
      },
      prediction: {
        outcome: 'HOME',
        confidence: 65,
        scorePrediction: '112-108',
        aiReasoning: 'Lakers paint dominance (54 PIP) exploiting Warriors small ball lineup.',
        keyInsight: 'LeBron +12 when Curry sits',
        weather: 'Indoors',
        sentiment: 'POSITIVE',
        probability: { home: 60, draw: 0, away: 40 },
        isValuePick: false,
        odds: { home: 1.85, draw: 15.00, away: 2.05 }
      },
      bettingTrends: {
          homeMoneyPercent: 80,
          homeTicketPercent: 78,
          lineMovement: 'STABLE',
          publicConsensus: 'Public heavy on Lakers'
      }
    },
    {
      id: 'm7',
      league: 'Bundesliga',
      homeTeam: { 
          id: 'b1', 
          name: 'Bayern', 
          logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
          record: '1st'
      },
      awayTeam: { 
          id: 'b2', 
          name: 'Dortmund', 
          logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
          record: '3rd'
      },
      status: MatchStatus.SCHEDULED,
      time: '18:30',
      venue: 'Allianz Arena',
      referee: 'Deniz Aytekin',
      keyPlayers: {
          home: [{ id: 'k1', name: 'Harry Kane', avatar: 'https://ui-avatars.com/api/?name=Harry+Kane', number: 9, position: 'FW', stats: [{ label: 'G', value: 24 }], rating: 9.1 }],
          away: [{ id: 'k2', name: 'Julian Brandt', avatar: 'https://ui-avatars.com/api/?name=Julian+Brandt', number: 19, position: 'MF', stats: [{ label: 'A', value: 12 }], rating: 8.2 }]
      },
      prediction: {
        outcome: 'HOME',
        confidence: 60,
        scorePrediction: '3-2',
        aiReasoning: 'Der Klassiker. Bayern at Allianz usually delivers goals.',
        keyInsight: 'Kane 5 goals in last 3',
        weather: 'Clear',
        sentiment: 'NEUTRAL',
        probability: { home: 50, draw: 20, away: 30 },
        isValuePick: true,
        potentialReturn: '-110',
        odds: { home: 1.90, draw: 3.80, away: 3.60 }
      }
    },
    {
      id: 'm2',
      league: 'Serie A',
      homeTeam: { 
          id: 't3', 
          name: 'Atalanta', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
          form: ['W', 'W', 'L', 'L', 'W'],
          record: '12-5-4',
          rank: 4
      },
      awayTeam: { 
          id: 't4', 
          name: 'Juventus', 
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Juventus_FC_2017_icon_%28black%29.svg/2048px-Juventus_FC_2017_icon_%28black%29.svg.png',
          form: ['D', 'W', 'W', 'D', 'W'],
          record: '14-6-1',
          rank: 2
      },
      status: MatchStatus.SCHEDULED,
      time: '20:45',
      prediction: {
        outcome: 'DRAW',
        confidence: 45,
        scorePrediction: '1-1',
        aiReasoning: 'Juventus defensive solidity (0.6 GA/90) vs Atalanta high press. Low scoring draw expected.',
        keyInsight: 'CR7 updated to starting lineup',
        xG: { home: 1.1, away: 0.9 },
        weather: 'Clear 14°C',
        sentiment: 'NEUTRAL',
        injuries: ['Chiesa (Out)'],
        probability: { home: 33, draw: 34, away: 33 },
        isValuePick: true,
        potentialReturn: '+210',
        odds: { home: 2.90, draw: 3.10, away: 2.65 }
      },
      context: {
          headline: "Vlahovic looking sharp in warmup.",
          commentCount: 890,
          isHot: false
      }
    },
    {
      id: 'm8',
      league: 'NFL',
      homeTeam: { 
          id: 'nfl3', 
          name: 'Bills', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/7/77/Buffalo_Bills_logo.svg',
          record: '11-6'
      },
      awayTeam: { 
          id: 'nfl4', 
          name: 'Chiefs', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg',
          record: '13-4'
      },
      status: MatchStatus.SCHEDULED,
      time: 'Sun 16:25',
      prediction: {
        outcome: 'AWAY',
        confidence: 52,
        scorePrediction: '24-27',
        aiReasoning: 'Mahomes in playoffs is a different beast. Bills secondary injuries concerning.',
        keyInsight: 'Playoff Rematch',
        weather: 'Cold',
        sentiment: 'POSITIVE',
        probability: { home: 45, draw: 0, away: 55 },
        isValuePick: true,
        potentialReturn: '+105',
        odds: { home: 1.80, draw: 12.00, away: 2.05 }
      }
    },
    {
      id: 'm5',
      league: 'UFC',
      homeTeam: {
        id: 'ufc1',
        name: 'Jon Jones',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/UFC_Logo.svg/2560px-UFC_Logo.svg.png',
        record: '27-1-0'
      },
      awayTeam: {
        id: 'ufc2',
        name: 'Stipe Miocic',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/UFC_Logo.svg/2560px-UFC_Logo.svg.png',
        record: '20-4-0'
      },
      status: MatchStatus.SCHEDULED,
      time: 'Sat 22:00',
      prediction: {
        outcome: 'HOME',
        confidence: 88,
        scorePrediction: 'TKO R3',
        aiReasoning: 'Reach advantage and wrestling base heavily favor Jones.',
        keyInsight: 'Miocic coming off 2yr layoff',
        weather: 'Indoors',
        sentiment: 'POSITIVE',
        probability: { home: 80, draw: 0, away: 20 },
        isValuePick: false,
        odds: { home: 1.25, draw: 50.00, away: 4.50 }
      }
    },
     {
      id: 'm3',
      league: 'EPL',
      homeTeam: { 
          id: 't5', 
          name: 'Arsenal', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
          form: ['W', 'W', 'W', 'W', 'W'],
          record: '18-2-1',
          rank: 1
      },
      awayTeam: { 
          id: 't6', 
          name: 'Chelsea', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
          form: ['L', 'D', 'W', 'L', 'L'],
          record: '8-6-6',
          rank: 9
      },
      status: MatchStatus.SCHEDULED,
      time: '15:00',
      venue: 'Emirates Stadium',
      venueDetails: {
          capacity: "60,704",
          opened: "2006",
          city: "London",
          country: "UK",
          imageUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=1000&auto=format&fit=crop",
          description: "The Emirates Stadium is the fourth-largest football stadium in England. Known for its immaculate playing surface and modern architecture, it replaced Highbury as Arsenal's home.",
          mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"
      },
      referee: 'Michael Oliver',
      stats: {
          possession: { home: 62, away: 38 },
          shots: { home: 15, away: 6 },
          shotsOnTarget: { home: 7, away: 2 },
          corners: { home: 8, away: 3 },
          fouls: { home: 9, away: 12 },
          yellowCards: { home: 1, away: 3 },
          passAccuracy: { home: 88, away: 79 }
      },
      keyPlayers: {
          home: [
              { id: 'kp1', name: 'Bukayo Saka', avatar: 'https://ui-avatars.com/api/?name=Bukayo+Saka&background=EF0107&color=fff', number: 7, position: 'RW', stats: [{label: 'G', value: 12}, {label: 'A', value: 8}], rating: 8.8 },
              { id: 'kp2', name: 'Martin Ødegaard', avatar: 'https://ui-avatars.com/api/?name=Martin+Odegaard&background=EF0107&color=fff', number: 8, position: 'CAM', stats: [{label: 'A', value: 10}], rating: 8.5 }
          ],
          away: [
              { id: 'kp3', name: 'Cole Palmer', avatar: 'https://ui-avatars.com/api/?name=Cole+Palmer&background=034694&color=fff', number: 20, position: 'CAM', stats: [{label: 'G', value: 14}, {label: 'A', value: 9}], rating: 8.9 },
              { id: 'kp4', name: 'Enzo Fernandez', avatar: 'https://ui-avatars.com/api/?name=Enzo+Fernandez&background=034694&color=fff', number: 8, position: 'CM', stats: [{label: 'P', value: '89%'}], rating: 7.2 }
          ]
      },
      timeline: [
           { id: 'tl_pre1', type: 'SOCIAL', minute: "Pre-Match", source: "@Arsenal", avatar: "https://ui-avatars.com/api/?name=AFC&background=EF0107&color=fff", description: "The boys have arrived at the Emirates. Huge atmosphere building! 🔴⚪️", mediaUrl: "https://images.unsplash.com/photo-1504198266287-1659872e6590?q=80&w=500&auto=format&fit=crop", likes: 25000 },
           { id: 'tl_pre2', type: 'INJURY', minute: "Pre-Match", description: "BREAKING: Reece James pulled out of warmups. Gusto expected to start.", source: "Sky Sports" }
      ],
      videos: [
           { id: 'v_preview', type: 'HIGHLIGHT', title: 'Match Preview & Analysis', duration: '2:30', thumbnail: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=500&auto=format&fit=crop' },
           { id: 'v_press', type: 'INTERVIEW', title: 'Arteta Press Conference', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500&auto=format&fit=crop' }
      ],
      prediction: {
        outcome: 'HOME',
        confidence: 82,
        scorePrediction: '3-1',
        aiReasoning: 'Arsenal dominant at home. Chelsea struggles against low block.',
        keyInsight: 'Saka vs Chilwell mismatch',
        xG: { home: 2.4, away: 0.6 },
        weather: 'Rain 9°C',
        sentiment: 'POSITIVE',
        injuries: [],
        probability: { home: 65, draw: 20, away: 15 },
        isValuePick: false,
        odds: { home: 1.62, draw: 4.00, away: 5.50 }
      },
      standings: [
          { rank: 1, teamId: 't5', teamName: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', played: 21, won: 18, drawn: 2, lost: 1, points: 56, form: ['W','W','W','W','W'] },
          { rank: 2, teamId: 'tX', teamName: 'Man City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg', played: 21, won: 16, drawn: 3, lost: 2, points: 51, form: ['W','D','W','W','L'] },
          { rank: 3, teamId: 'tY', teamName: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', played: 21, won: 15, drawn: 4, lost: 2, points: 49, form: ['D','W','W','L','W'] },
          { rank: 9, teamId: 't6', teamName: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg', played: 21, won: 8, drawn: 6, lost: 7, points: 30, form: ['L','D','W','L','L'] },
      ]
    },
    {
      id: 'm9',
      league: 'Ligue 1',
      homeTeam: { 
          id: 'l1', 
          name: 'PSG', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
          record: '1st'
      },
      awayTeam: { 
          id: 'l2', 
          name: 'Marseille', 
          logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
          record: '4th'
      },
      status: MatchStatus.SCHEDULED,
      time: '21:00',
      prediction: {
        outcome: 'HOME',
        confidence: 70,
        scorePrediction: '2-0',
        aiReasoning: 'Le Classique. Mbappe pace vs Marseille high line.',
        keyInsight: 'Marseille poor away form',
        weather: 'Clear',
        sentiment: 'POSITIVE',
        probability: { home: 60, draw: 25, away: 15 },
        isValuePick: true,
        potentialReturn: '-140',
        odds: { home: 1.70, draw: 3.90, away: 4.80 }
      }
    },
    {
      id: 'm10',
      league: 'NBA',
      homeTeam: {
        id: 'nba3',
        name: 'Celtics',
        logo: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg',
        record: '30-10'
      },
      awayTeam: {
        id: 'nba4',
        name: 'Bucks',
        logo: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg',
        record: '28-12'
      },
      status: MatchStatus.SCHEDULED,
      time: '19:30',
      prediction: {
        outcome: 'AWAY',
        confidence: 48,
        scorePrediction: '115-118',
        aiReasoning: 'Giannis matchup nightmare for Celtics interior without Porzingis.',
        keyInsight: 'Bucks +4.5 Spread',
        weather: 'Indoors',
        sentiment: 'NEUTRAL',
        probability: { home: 48, draw: 0, away: 52 },
        isValuePick: true,
        potentialReturn: '+160',
        odds: { home: 1.55, draw: 12.00, away: 2.60 }
      }
    },
    {
      id: 'm6',
      league: 'LaLiga',
      homeTeam: { 
          id: 't7', 
          name: 'Real Madrid', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
          form: ['W', 'W', 'W', 'D', 'W'],
          record: '1st'
      },
      awayTeam: { 
          id: 't8', 
          name: 'Barcelona', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
          form: ['W', 'W', 'W', 'W', 'W'],
          record: '2nd'
      },
      status: MatchStatus.SCHEDULED,
      time: 'Sun 20:00',
      prediction: {
        outcome: 'AWAY',
        confidence: 55,
        scorePrediction: '1-2',
        aiReasoning: 'Barca midfield controlling tempo. Madrid vulnerable on counter.',
        keyInsight: 'El Clasico Title Decider',
        xG: { home: 1.2, away: 1.4 },
        weather: 'Clear',
        sentiment: 'POSITIVE',
        probability: { home: 35, draw: 25, away: 40 },
        isValuePick: true,
        potentialReturn: '+180',
        odds: { home: 2.50, draw: 3.40, away: 2.80 }
      }
    },
    {
        id: 'm11',
        league: 'NHL',
        homeTeam: { id: 'nhl1', name: 'Rangers', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/New_York_Rangers.svg', record: '29-15' },
        awayTeam: { id: 'nhl2', name: 'Devils', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9f/New_Jersey_Devils_logo.svg', record: '24-18' },
        status: MatchStatus.SCHEDULED,
        time: '19:00',
        prediction: { outcome: 'HOME', confidence: 62, scorePrediction: '4-2', aiReasoning: 'Shesterkin in net gives NYR huge edge.', keyInsight: 'Devils B2B game', weather: 'Indoors', probability: { home: 60, draw: 0, away: 40 }, isValuePick: true, potentialReturn: '-130', odds: { home: 1.75, draw: 4.20, away: 3.50 } }
    },
    {
        id: 'm12',
        league: 'NCAA',
        homeTeam: { id: 'ncaa1', name: 'Duke', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Duke_Athletics_logo.svg', record: '15-3' },
        awayTeam: { id: 'ncaa2', name: 'UNC', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/North_Carolina_Tar_Heels_logo.svg', record: '14-4' },
        status: MatchStatus.SCHEDULED,
        time: '21:00',
        prediction: { outcome: 'HOME', confidence: 58, scorePrediction: '82-78', aiReasoning: 'Cameron Indoor advantage is real.', keyInsight: 'Rivalry Game', weather: 'Indoors', probability: { home: 58, draw: 0, away: 42 }, isValuePick: false, odds: { home: 1.80, draw: 12.00, away: 2.05 } }
    },
    {
        id: 'm13',
        league: 'NBA',
        homeTeam: { id: 'nba5', name: 'Nuggets', logo: 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg', record: '31-13' },
        awayTeam: { id: 'nba6', name: 'Suns', logo: 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg', record: '25-18' },
        status: MatchStatus.SCHEDULED,
        time: '22:30',
        prediction: { outcome: 'HOME', confidence: 72, scorePrediction: '118-110', aiReasoning: 'Jokic triple double watch vs weak Suns interior.', keyInsight: 'Altitude Factor', weather: 'Indoors', probability: { home: 70, draw: 0, away: 30 }, isValuePick: false, odds: { home: 1.45, draw: 14.00, away: 2.80 } }
    },
     {
        id: 'm14',
        league: 'EPL',
        homeTeam: { id: 't9', name: 'Man Utd', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg', record: '6th' },
        awayTeam: { id: 't10', name: 'Spurs', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg', record: '5th' },
        status: MatchStatus.SCHEDULED,
        time: 'Sun 12:30',
        prediction: { outcome: 'AWAY', confidence: 51, scorePrediction: '1-2', aiReasoning: 'Spurs high line risky but Utd attack misfiring.', keyInsight: 'Son returns', weather: 'Rain', probability: { home: 30, draw: 20, away: 50 }, isValuePick: true, potentialReturn: '+150', odds: { home: 2.80, draw: 3.50, away: 2.50 } }
    }
  ];

  const news: NewsStory[] = [
    {
      id: 'n1',
      type: 'NEWS',
      title: "Liverpool and Barcelona in transfer talks",
      summary: "Breaking reports from Spain suggest a swap deal involving Frenkie de Jong is on the table.",
      imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000&auto=format&fit=crop",
      source: "Sheena AI News Agent",
      timestamp: "10m",
      likes: 15400,
      comments: 3420,
      isHero: true,
      authorAvatar: 'https://ui-avatars.com/api/?name=Fabrizio',
      tags: ['Transfers', 'La Liga', 'EPL'],
      body: [
        "Reports emerging from Catalonia suggest Barcelona and Liverpool have opened preliminary discussions.",
        "QUERY:The deal could reshape the midfield for both European giants.",
        "Financial fair play regulations are believed to be a driving factor for the Catalan club."
      ],
      relatedIds: ['n3']
    },
    {
      id: 'n2',
      type: 'NEWS',
      title: "QB suspended 6 games",
      summary: "Shock announcement from the commissioner's office today.",
      imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=2000&auto=format&fit=crop",
      source: "Shideng A News Agent",
      timestamp: "2h",
      likes: 8400,
      comments: 1200,
      tags: ['NFL', 'Breaking'],
      body: [
        "The league has handed down a 6-game suspension effective immediately.",
        "Appeals are expected to be filed by the players association within 24 hours."
      ]
    },
    {
        id: 'h1',
        type: 'HIGHLIGHT',
        title: "Best moments from last night",
        summary: "Top 10 plays from the NBA action.",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ee2?q=80&w=2000&auto=format&fit=crop",
        source: "NBA Highlights",
        timestamp: "5h",
        likes: 5000,
        comments: 200
    },
     {
        id: 'h2',
        type: 'HIGHLIGHT',
        title: "Incredible Goal!",
        summary: "Puskas contender from the Brazilian league.",
        imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop",
        source: "Global Football",
        timestamp: "1d",
        likes: 12000,
        comments: 800
    }
  ];

  // NEW: SYSTEM ALERTS FOR THE FEED
  const alerts: SystemAlert[] = [
      {
          id: 'alert1',
          type: 'SYSTEM_ALERT',
          alertType: 'SHARP_MONEY',
          title: 'Sharp Action Alert',
          description: 'Heavy professional volume detected on Bills -2.5 despite public backing Chiefs.',
          dataPoint: '88% Money / 42% Tickets',
          league: 'NFL',
          timestamp: '2m ago'
      },
      {
          id: 'alert2',
          type: 'SYSTEM_ALERT',
          alertType: 'LINE_MOVE',
          title: 'Line Freeze Warning',
          description: 'Lakers line moved from -4 to -5.5 in last 10 minutes. Injury news pending.',
          dataPoint: '-1.5 Move',
          league: 'NBA',
          timestamp: '15m ago'
      },
      {
          id: 'alert3',
          type: 'SYSTEM_ALERT',
          alertType: 'TRENDING_PROP',
          title: 'Prop Market Heat',
          description: 'Erling Haaland "Over 1.5 Goals" receiving massive global handle.',
          dataPoint: 'High Vol',
          league: 'EPL',
          timestamp: '1h ago'
      }
  ];

  return { matches, news, alerts };
};

const AppContent = () => {
  const [isPwezaOpen, setIsPwezaOpen] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allNews, setAllNews] = useState<NewsStory[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { matches, news, alerts } = generateMockData();
    setMatches(matches);
    setAllNews(news);
    
    // Interleave content to create "Endless Stream" feel
    // Pattern: [Hero News] -> [Match] -> [Alert] -> [News] -> [Match] -> [Highlight] -> [Match] -> [Alert]
    const mixedFeed: FeedItem[] = [];
    
    // Add Hero first
    const hero = news.find(n => n.isHero);
    if (hero) mixedFeed.push(hero);

    const remainingNews = news.filter(n => !n.isHero);
    const predictions = matches.sort((a,b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));

    // Simple mix logic
    let mIdx = 0;
    let nIdx = 0;
    let aIdx = 0;

    while (mIdx < predictions.length || nIdx < remainingNews.length) {
        // Add 2 matches
        if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
        if (mIdx < predictions.length) mixedFeed.push(predictions[mIdx++]);
        
        // Add 1 Alert
        if (aIdx < alerts.length) mixedFeed.push(alerts[aIdx++]);

        // Add 1 News
        if (nIdx < remainingNews.length) mixedFeed.push(remainingNews[nIdx++]);
    }

    setFeedItems(mixedFeed);
  }, []);

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');
  
  const ArticleRouteWrapper = () => {
      const { id } = useParams();
      const story = allNews.find(n => n.id === id);
      if (!story) return <div className="p-20 text-center">Story not found</div>;
      
      const related = allNews.filter(n => n.id !== id).slice(0, 2);
      return <ArticlePage story={story} relatedStories={related} />;
  }

  const MatchRouteWrapper = () => {
      const { id } = useParams();
      const match = matches.find(m => m.id === id);
      if (!match) return <div className="p-20 text-center">Match not found</div>;
      
      return <MatchDetailPage match={match} onOpenPweza={() => setIsPwezaOpen(true)} />;
  }

  const handleOpenPweza = () => setIsPwezaOpen(true);

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)}
      onOpenPweza={handleOpenPweza}
    >
      <Routes>
        <Route path="/" element={<Feed items={feedItems} matches={matches} onArticleClick={(id) => navigate(`/article/${id}`)} onOpenPweza={handleOpenPweza} />} />
        <Route path="/scores" element={<Feed items={matches} matches={matches} onArticleClick={(id) => navigate(`/article/${id}`)} onOpenPweza={handleOpenPweza} />} />
        <Route path="/trending" element={<Feed items={feedItems.filter(i => 'type' in i)} matches={matches} onArticleClick={(id) => navigate(`/article/${id}`)} onOpenPweza={handleOpenPweza} />} />
        <Route path="/article/:id" element={<ArticleRouteWrapper />} />
        <Route path="/match/:id" element={<MatchRouteWrapper />} />
        <Route path="*" element={<div className="p-20 text-center text-[#A1A1A1] font-condensed font-bold text-xl">COMING SOON</div>} />
      </Routes>

      <Pweza isOpen={isPwezaOpen} onClose={() => setIsPwezaOpen(false)} />
    </Layout>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;