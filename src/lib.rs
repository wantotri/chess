pub mod game;
pub mod error;

use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use game::*;
use game::prelude::*;

thread_local! {
    static BOARD: RefCell<Board<Piece>> = RefCell::new(Board::new());
}

#[wasm_bindgen(js_name = boardStr)]
pub fn board_str() -> String {
    BOARD.with(|board| {
        board.borrow().to_string()
    })
}

#[wasm_bindgen(js_name = invert)]
pub fn invert(row: i8, col: i8) -> String {
    game::invert(row, col).unwrap()
}

#[wasm_bindgen(js_name = getPossibleMoves)]
pub fn get_possible_moves(cell: &str) -> String {
    BOARD.with(|board| {
        board.borrow().get_possible_moves_as_string(cell)
    })
}

#[wasm_bindgen(js_name = movePiece)]
pub fn move_piece(src_cell: &str, des_cell: &str) -> String {
    BOARD.with(|board| {
        let piece = board.borrow().get(src_cell).unwrap().unwrap();

        // Do castling
        if piece.level == Level::King && !piece.moved.unwrap() {
            if let Some(rook) = board.borrow_mut().get(des_cell).unwrap() {
                if piece.color == rook.color && !rook.moved.unwrap() {
                    match board.borrow_mut().castling(src_cell, des_cell) {
                        Ok(msg) => return msg,
                        Err(err) => return err.to_string()
                    }
                }
            }
        }

        let output = match board.borrow_mut().moves_piece(src_cell, des_cell) {
            Ok(msg) => format!("{}", msg),
            Err(err) => format!("{}", err)
        };
        if board.borrow().is_king_checked(piece.color).unwrap() {
            board.borrow_mut().undo_moves().unwrap();
            return format!("Illegal Moves");
        }

        let enemy_color = game::get_enemy_color(piece.color);
        if board.borrow_mut().is_checkmate(enemy_color).unwrap() {
            return format!("{} Checkmate", output)
        }
        if board.borrow().is_king_checked(enemy_color).unwrap() {
            return format!("{} Check", output)
        }
        if board.borrow_mut().is_draw(enemy_color).unwrap() {
            return format!("{} Draw", output)
        }
        output
    })
}

#[wasm_bindgen(js_name = pawnPromote)]
pub fn pawn_promote(cell: &str, level: &str) -> String {
    let possible_promotion = vec!["queen", "bishop", "knight", "rook"];
    if !possible_promotion.iter().any(|lev| { *lev == level }) {
        return format!("Something went wrong | level not possible")
    }

    let promotion_level = match level {
        "queen" => Level::Queen,
        "bishop" => Level::Bishop,
        "knight" => Level::Knight,
        "rook" => Level::Rook,
        _ => Level::Pawn
    };

    return BOARD.with(|board| {
        board.borrow_mut().promote(cell, promotion_level).unwrap();
        let piece = board.borrow().get(cell).unwrap().unwrap();
        if board.borrow_mut().is_checkmate(game::get_enemy_color(piece.color)).unwrap() {
            return format!("Promoted to {} Checkmate", level);
        }
        if board.borrow().is_king_checked(game::get_enemy_color(piece.color)).unwrap() {
            return format!("Promoted to {} Check", level);
        }
        if board.borrow_mut().is_draw(game::get_enemy_color(piece.color)).unwrap() {
            return format!("Promoted to {} Draw", level);
        }
        return format!("Promoted to {}", level);
    });
}

#[wasm_bindgen(js_name = getCaptured)]
pub fn get_captured(color: &str) -> String {
    let color = if color == "white" { Color::White } else { Color::Black };
    BOARD.with(|board| {
        let captured = board.borrow().get_captured(color).unwrap();
        captured.iter()
            .map(|piece| { piece.to_string() })
            .collect::<Vec<String>>()
            .join(" ")
    })
}
