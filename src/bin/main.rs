use chess::game::prelude::*;

fn main() {
    let mut board = Board::new();

    moves_and_print(&mut board, "e2", "e4");
    moves_and_print(&mut board, "e7", "e5");
    moves_and_print(&mut board, "d1", "f3");
    moves_and_print(&mut board, "f8", "c5");
    moves_and_print(&mut board, "f1", "c4");
    moves_and_print(&mut board, "b8", "c6");
    moves_and_print(&mut board, "f3", "f7");

    if board.is_checkmate(Color::Black).unwrap() {
        println!("Checkmate. White Win.")
    }
}

fn moves_and_print(board: &mut Board<Piece>, src_cell: &str, des_cell: &str) {
    match board.moves_piece(src_cell, des_cell) {
        Ok(msg) => println!("{msg}"),
        Err(e) => println!("{e}")
    };
    println!("\n");
    board.print().unwrap();
    println!("\n");
}