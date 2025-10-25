import XCTest
import SwiftTreeSitter
import TreeSitterExtremexos

final class TreeSitterExtremexosTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_extremexos())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ExtremeXOS grammar")
    }
}
